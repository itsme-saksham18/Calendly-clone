const express = require('express');
const router  = express.Router();
const pool    = require('../lib/db');
const { sendBookingConfirmation } = require('../lib/mailer');

function generateSlots(date, startTime, endTime, durationMinutes, bufferBefore, bufferAfter) {
  const slots = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH,   endM]   = endTime.split(':').map(Number);

  const slotStart = new Date(date); slotStart.setHours(startH, startM, 0, 0);
  const dayEnd    = new Date(date); dayEnd.setHours(endH, endM, 0, 0);
  const totalSlot = durationMinutes + bufferBefore + bufferAfter;

  while (true) {
    const actualStart = new Date(slotStart.getTime() + bufferBefore * 60000);
    const actualEnd   = new Date(actualStart.getTime() + durationMinutes * 60000);
    if (new Date(actualEnd.getTime() + bufferAfter * 60000) > dayEnd) break;
    slots.push({ start: new Date(actualStart), end: new Date(actualEnd) });
    slotStart.setTime(slotStart.getTime() + totalSlot * 60000);
  }
  return slots;
}

// GET available slots
router.get('/slots', async (req, res, next) => {
  try {
    const { date, eventTypeId } = req.query;
    if (!date || !eventTypeId) return res.status(400).json({ error: 'date and eventTypeId required' });

    const requestedDate = new Date(date);
    const dayOfWeek     = requestedDate.getDay();

    const { rows: etRows } = await pool.query(
      'SELECT * FROM event_types WHERE id = $1 AND is_active = true', [eventTypeId]
    );
    if (!etRows.length) return res.status(404).json({ error: 'Event type not found' });
    const et = etRows[0];

    const { rows: avRows } = await pool.query(
      'SELECT * FROM availability WHERE user_id = 1 AND day_of_week = $1', [dayOfWeek]
    );
    if (!avRows.length) return res.json([]);

    const av      = avRows[0];
    const allSlots = generateSlots(
      requestedDate, av.start_time, av.end_time,
      et.duration_minutes,
      et.buffer_before || 0,
      et.buffer_after  || 0
    );

    const dayStart = new Date(requestedDate); dayStart.setHours(0,0,0,0);
    const dayEnd   = new Date(requestedDate); dayEnd.setHours(23,59,59,999);

    const { rows: existing } = await pool.query(
      `SELECT start_time, end_time FROM bookings
       WHERE event_type_id = $1 AND status = 'confirmed'
         AND start_time >= $2 AND end_time <= $3`,
      [eventTypeId, dayStart, dayEnd]
    );

    const now = new Date();
    const available = allSlots.filter(slot => {
      if (slot.start <= now) return false;
      return !existing.some(b => {
        const bStart = new Date(b.start_time);
        const bEnd   = new Date(b.end_time);
        // Account for buffer when checking conflicts
        const bufBefore = (et.buffer_before || 0) * 60000;
        const bufAfter  = (et.buffer_after  || 0) * 60000;
        return (bStart - bufAfter) < slot.end && (bEnd + bufBefore) > slot.start;
      });
    });

    res.json(available);
  } catch (err) { next(err); }
});

// POST create booking (with answers)
router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { event_type_id, invitee_name, invitee_email, start_time, end_time, answers } = req.body;

    if (!event_type_id || !invitee_name || !invitee_email || !start_time || !end_time) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    await client.query('BEGIN');

    // Double-booking check
    const { rows: conflict } = await client.query(
      `SELECT id FROM bookings
       WHERE event_type_id = $1 AND status = 'confirmed'
         AND start_time < $3 AND end_time > $2`,
      [event_type_id, new Date(start_time), new Date(end_time)]
    );
    if (conflict.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    // Insert booking
    const { rows } = await client.query(
      `INSERT INTO bookings (event_type_id, invitee_name, invitee_email, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [event_type_id, invitee_name, invitee_email, new Date(start_time), new Date(end_time)]
    );
    const booking = rows[0];

    // Insert answers if provided
    if (answers && answers.length > 0) {
      for (const ans of answers) {
        await client.query(
          `INSERT INTO booking_answers (booking_id, question_id, answer) VALUES ($1, $2, $3)`,
          [booking.id, ans.question_id, ans.answer]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch full booking with event details
    const { rows: full } = await pool.query(
      `SELECT b.*, e.name as event_name, e.duration_minutes, e.slug
       FROM bookings b JOIN event_types e ON b.event_type_id = e.id
       WHERE b.id = $1`, [booking.id]
    );

    // Send confirmation email (non-blocking)
    sendBookingConfirmation(full[0]).catch(err => console.error('Email error:', err));

    res.status(201).json(full[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
});

// POST reschedule a booking
router.post('/:id/reschedule', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { start_time, end_time } = req.body;
    if (!start_time || !end_time) return res.status(400).json({ error: 'start_time and end_time required' });

    await client.query('BEGIN');

    // Get original booking
    const { rows: orig } = await client.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    if (!orig.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Booking not found' }); }

    // Conflict check excluding this booking
    const { rows: conflict } = await client.query(
      `SELECT id FROM bookings
       WHERE event_type_id = $1 AND status = 'confirmed' AND id != $2
         AND start_time < $4 AND end_time > $3`,
      [orig[0].event_type_id, req.params.id, new Date(start_time), new Date(end_time)]
    );
    if (conflict.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'That time slot is already booked' });
    }

    const { rows } = await client.query(
      `UPDATE bookings SET start_time = $1, end_time = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [new Date(start_time), new Date(end_time), req.params.id]
    );

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
});

module.exports = router;