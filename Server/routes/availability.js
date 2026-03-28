const express = require('express');
const router = express.Router();
const pool = require('../lib/db');

// GET availability for default user
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM availability WHERE user_id = 1 ORDER BY day_of_week ASC'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PUT replace all availability (send full week config at once)
router.put('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { availability } = req.body;
    // availability = [{ day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' }, ...]

    await client.query('BEGIN');
    await client.query('DELETE FROM availability WHERE user_id = 1');

    if (availability && availability.length > 0) {
      const values = availability.map((_, i) =>
        `(1, $${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`
      ).join(', ');

      const params = availability.flatMap(a => [a.day_of_week, a.start_time, a.end_time]);

      await client.query(
        `INSERT INTO availability (user_id, day_of_week, start_time, end_time) VALUES ${values}`,
        params
      );
    }

    await client.query('COMMIT');

    const { rows } = await client.query(
      'SELECT * FROM availability WHERE user_id = 1 ORDER BY day_of_week ASC'
    );
    res.json(rows);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;