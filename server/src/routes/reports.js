const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { SLOTS, todayStr } = require('../utils/validateReading');

router.use(auth);

const pad = (n) => String(n).padStart(2, '0');
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m = 1..12

// Date ranges for the three reports, based on the selected date
function getRanges(date) {
  const [y, m] = date.split('-').map(Number);
  const prevY = m === 1 ? y - 1 : y;
  const prevM = m === 1 ? 12 : m - 1;
  return {
    daily: { from: date, to: date },
    mtd: { from: `${y}-${pad(m)}-01`, to: date },
    monthly: {
      from: `${prevY}-${pad(prevM)}-01`,
      to: `${prevY}-${pad(prevM)}-${pad(lastDay(prevY, prevM))}`,
    },
  };
}

async function stats(userId, from, to) {
  const { rows } = await pool.query(
    `SELECT MAX(value) AS highest, MIN(value) AS lowest,
            ROUND(AVG(value), 1) AS average, COUNT(*)::int AS count
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to]
  );
  const r = rows[0];
  return {
    from,
    to,
    count: r.count,
    highest: r.highest,
    lowest: r.lowest,
    average: r.average === null ? null : Number(r.average),
  };
}

// GET /api/reports?date=YYYY-MM-DD  (date defaults to today)
router.get('/', async (req, res) => {
  const date = req.query.date || todayStr();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'Please choose a valid date.' });
  }
  try {
    const ranges = getRanges(date);
    const [daily, mtd, monthly, list] = await Promise.all([
      stats(req.userId, ranges.daily.from, ranges.daily.to),
      stats(req.userId, ranges.mtd.from, ranges.mtd.to),
      stats(req.userId, ranges.monthly.from, ranges.monthly.to),
      pool.query(
        `SELECT id, slot, value FROM readings
         WHERE user_id = $1 AND reading_date = $2 ORDER BY id`,
        [req.userId, date]
      ),
    ]);
    daily.readings = list.rows.map((r) => ({ ...r, slotLabel: SLOTS[r.slot] }));
    res.json({ date, daily, monthToDate: mtd, monthly });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
module.exports.getRanges = getRanges; // exported for tests