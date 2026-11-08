require('dotenv').config({ quiet: true });
const { Pool, types } = require('pg');

// DATE columns ni 'YYYY-MM-DD' string ga ivvadaniki (timezone problems raavu)
types.setTypeParser(1082, (v) => v);

const pool = new Pool({
  connectionString:
    process.env.NODE_ENV === 'test'
      ? process.env.TEST_DATABASE_URL
      : process.env.DATABASE_URL,
});

module.exports = pool;
