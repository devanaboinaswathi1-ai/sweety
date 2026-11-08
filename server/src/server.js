require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error('Listen failed:', err.message);
    process.exit(1);
  }
  console.log(`API running on port ${PORT}`);
});