require('dotenv').config();
const pool = require('../lib/db');

function nextWeekday(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Seeding...');

    // Clear in reverse FK order
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM availability');
    await client.query('DELETE FROM event_types');
    await client.query('DELETE FROM users');

    // Reset sequences
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE event_types_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE bookings_id_seq RESTART WITH 1');

    // Default user
    await client.query(
      'INSERT INTO users (name, timezone) VALUES ($1, $2)',
      ['Alex Johnson', 'America/New_York']
    );

    // 3 event types
    await client.query(`
      INSERT INTO event_types (user_id, name, slug, duration_minutes, description) VALUES
        (1, '15 Minute Chat',    '15min-chat',    15, 'A quick 15-minute introductory call.'),
        (1, '30 Minute Meeting', '30min-meeting',  30, 'A standard 30-minute meeting.'),
        (1, '1 Hour Deep Dive',  '1hr-deep-dive',  60, 'An in-depth 60-minute session.')
    `);

    // Mon–Fri, 9am–5pm
    await client.query(`
      INSERT INTO availability (user_id, day_of_week, start_time, end_time) VALUES
        (1, 1, '09:00:00', '17:00:00'),
        (1, 2, '09:00:00', '17:00:00'),
        (1, 3, '09:00:00', '17:00:00'),
        (1, 4, '09:00:00', '17:00:00'),
        (1, 5, '09:00:00', '17:00:00')
    `);

    // Sample bookings
    const day1    = nextWeekday(1);
    const day2    = nextWeekday(3);
    const pastDay = new Date();
    pastDay.setDate(pastDay.getDate() - 7);
    while (pastDay.getDay() === 0 || pastDay.getDay() === 6) {
      pastDay.setDate(pastDay.getDate() - 1);
    }

    const b1s = new Date(day1);    b1s.setHours(10, 0, 0, 0);
    const b1e = new Date(day1);    b1e.setHours(10, 15, 0, 0);
    const b2s = new Date(day2);    b2s.setHours(14, 0, 0, 0);
    const b2e = new Date(day2);    b2e.setHours(14, 30, 0, 0);
    const b3s = new Date(pastDay); b3s.setHours(11, 0, 0, 0);
    const b3e = new Date(pastDay); b3e.setHours(12, 0, 0, 0);

    await client.query(`
      INSERT INTO bookings
        (event_type_id, invitee_name, invitee_email, start_time, end_time, status)
      VALUES
        (1, 'Sarah Connor', 'sarah@example.com', $1, $2, 'confirmed'),
        (2, 'John Doe',     'john@example.com',  $3, $4, 'confirmed'),
        (3, 'Jane Smith',   'jane@example.com',  $5, $6, 'confirmed')
    `, [b1s, b1e, b2s, b2e, b3s, b3e]);

    console.log('Seed complete.');
  } finally {
    client.release();
    process.exit(0);
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});