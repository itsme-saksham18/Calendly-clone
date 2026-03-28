const express = require('express');
const router = express.Router();
const pool = require('../lib/db');
const { sendCancellationEmail } = require('../lib/mailer');

// GET all meetings (upcoming + past) with event type info
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, e.name as event_name, e.duration_minutes, e.slug
       FROM bookings b
       JOIN event_types e ON b.event_type_id = e.id
       WHERE e.user_id = 1
       ORDER BY b.start_time DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET upcoming meetings only
router.get('/upcoming', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, e.name as event_name, e.duration_minutes, e.slug
       FROM bookings b
       JOIN event_types e ON b.event_type_id = e.id
       WHERE e.user_id = 1
         AND b.status = 'confirmed'
         AND b.start_time >= NOW()
       ORDER BY b.start_time ASC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET past meetings only
router.get('/past', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, e.name as event_name, e.duration_minutes, e.slug
       FROM bookings b
       JOIN event_types e ON b.event_type_id = e.id
       WHERE e.user_id = 1
         AND b.start_time < NOW()
       ORDER BY b.start_time DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PATCH cancel a meeting
router.patch('/:id/cancel', async (req, res, next) => {
  try {
    // Get full booking first for email
    const { rows: full } = await pool.query(
      `SELECT b.*, e.name as event_name, e.duration_minutes
       FROM bookings b JOIN event_types e ON b.event_type_id = e.id
       WHERE b.id = $1`, [req.params.id]
    );
    if (!full.length) return res.status(404).json({ error: 'Meeting not found' });

    const { rows } = await pool.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 RETURNING *`, [req.params.id]
    );

    // Send cancellation email (non-blocking)
    sendCancellationEmail(full[0]).catch(err => console.error('Email error:', err));

    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;