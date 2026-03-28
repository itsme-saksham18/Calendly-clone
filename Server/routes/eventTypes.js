const express = require('express');
const router = express.Router();
const pool = require('../lib/db');

// GET all event types for default user (id=1)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM event_types WHERE user_id = 1 AND is_active = true ORDER BY created_at ASC'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET single event type by slug (used by public booking page)
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM event_types WHERE slug = $1 AND is_active = true',
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Event type not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// GET single event type by id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM event_types WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Event type not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST create event type
router.post('/', async (req, res, next) => {
  try {
    const { name, slug, duration_minutes, description, buffer_before, buffer_after } = req.body;
    if (!name || !slug || !duration_minutes) {
      return res.status(400).json({ error: 'name, slug and duration_minutes are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO event_types (user_id, name, slug, duration_minutes, description, buffer_before, buffer_after)
       VALUES (1, $1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, slug, duration_minutes, description || null, buffer_before || 0, buffer_after || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Slug already exists' });
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, slug, duration_minutes, description, buffer_before, buffer_after } = req.body;
    const { rows } = await pool.query(
      `UPDATE event_types
       SET name=$1, slug=$2, duration_minutes=$3, description=$4,
           buffer_before=$5, buffer_after=$6, updated_at=NOW()
       WHERE id=$7 AND user_id=1 RETURNING *`,
      [name, slug, duration_minutes, description || null, buffer_before || 0, buffer_after || 0, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Event type not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Slug already exists' });
    next(err);
  }
});


// DELETE event type (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE event_types SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND user_id = 1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Event type not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;