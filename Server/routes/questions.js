const express = require('express');
const router  = express.Router();
const pool    = require('../lib/db');

// GET questions for an event type
router.get('/:eventTypeId', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM event_questions WHERE event_type_id = $1 ORDER BY sort_order ASC',
      [req.params.eventTypeId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PUT replace all questions for an event type
router.put('/:eventTypeId', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { questions } = req.body;
    await client.query('BEGIN');
    await client.query('DELETE FROM event_questions WHERE event_type_id = $1', [req.params.eventTypeId]);

    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        await client.query(
          `INSERT INTO event_questions (event_type_id, question, is_required, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [req.params.eventTypeId, questions[i].question, questions[i].is_required || false, i]
        );
      }
    }
    await client.query('COMMIT');
    const { rows } = await pool.query(
      'SELECT * FROM event_questions WHERE event_type_id = $1 ORDER BY sort_order ASC',
      [req.params.eventTypeId]
    );
    res.json(rows);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
});

module.exports = router;