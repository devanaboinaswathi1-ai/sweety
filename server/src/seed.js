require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./db');

const SLOT_KEYS = ['morning', 'after_breakfast', 'after_lunch', 'after_dinner'];

// Date N days ago as YYYY-MM-DD
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('en-CA');
}

// Simple repeatable value between 90 and 190
const valueFor = (day, slot) => 90 + ((day * 17 + slot * 29) % 101);

async function seed() {
  const email = 'demo@sweety.com';
  const hash = await bcrypt.hash('demo1234', 10);

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ('Demo User', $1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [email, hash]
  );
  const userId = rows[0].id;

  await pool.query('DELETE FROM readings WHERE user_id = $1', [userId]);

  // Last 45 days so Daily, Month-to-date and Previous month reports all have data
  let count = 0;
  for (let day = 0; day < 45; day++) {
    const slotsToday = day % 5 === 0 ? 3 : 4; // a few days with fewer readings
    for (let s = 0; s < slotsToday; s++) {
      await pool.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4)`,
        [userId, daysAgo(day), SLOT_KEYS[s], valueFor(day, s)]
      );
      count++;
    }
  }

  console.log(`Seeded ${email} (password: demo1234) with ${count} readings.`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});