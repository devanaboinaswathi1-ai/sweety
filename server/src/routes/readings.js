const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { SLOTS, validateBasic } = require('../utils/validateReading');

// "a Morning (fasting)" / "an After lunch"
const withArticle = (label) => (/^[aeiou]/i.test(label) ? 'an ' : 'a ') + label;

router.use(auth); // every route below needs login

const COLS = `id, to_char(reading_date, 'YYYY-MM-DD') AS date, slot, value`;

// Rules that need the database: one per slot, max 4 per day
async function checkDbRules(userId, date, slot, excludeId = null) {
  const params = [userId, date];
  let extra = '';
  if (excludeId) {
    params.push(excludeId);
    extra = ' AND id <> $3';
  }
  const { rows } = await pool.query(
    `SELECT slot FROM readings WHERE user_id = $1 AND reading_date = $2${extra}`,
    params
  );
  if (rows.some((r) => r.slot === slot)) {
    return `You already have ${withArticle(SLOTS[slot])} reading for this date.`;
  }
  if (rows.length >= 4) return 'You can add only 4 readings per day.';
  return null;
}

// Add reading
router.post('/', async (req, res) => {
  const { date, slot, value } = req.body;
  try {
    const err = validateBasic({ date, slot, value }) ||
      (await checkDbRules(req.userId, date, slot));
    if (err) return res.status(400).json({ error: err });

    const { rows } = await pool.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4) RETURNING ${COLS}`,
      [req.userId, date, slot, Number(value)]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(400).json({
        error: `You already have ${withArticle(SLOTS[slot])} reading for this date.`,
      });
    }
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// List my readings (optional ?date=YYYY-MM-DD)
router.get('/', async (req, res) => {
  try {
    const params = [req.userId];
    let where = 'user_id = $1';
    if (req.query.date) {
      params.push(req.query.date);
      where += ' AND reading_date = $2';
    }
    const { rows } = await pool.query(
      `SELECT ${COLS} FROM readings WHERE ${where}
       ORDER BY reading_date DESC, id`,
      params
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Edit reading
router.put('/:id', async (req, res) => {
  const { date, slot, value } = req.body;
  try {
    const own = await pool.query(
      'SELECT id FROM readings WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!own.rows.length) return res.status(404).json({ error: 'Reading not found.' });

    const err = validateBasic({ date, slot, value }) ||
      (await checkDbRules(req.userId, date, slot, req.params.id));
    if (err) return res.status(400).json({ error: err });

    const { rows } = await pool.query(
      `UPDATE readings SET reading_date = $1, slot = $2, value = $3
       WHERE id = $4 AND user_id = $5 RETURNING ${COLS}`,
      [date, slot, Number(value), req.params.id, req.userId]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Delete reading
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Reading not found.' });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;