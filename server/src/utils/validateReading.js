const SLOTS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

// Today's date as YYYY-MM-DD
const todayStr = () => new Date().toLocaleDateString('en-CA');

// Checks that do not need the database
function validateBasic({ date, slot, value }) {
  if (value === undefined || value === null || value === '') {
    return 'Please enter a glucose value.';
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 40 || n > 600) {
    return 'Value must be between 40 and 600 mg/dl.';
  }
  if (!SLOTS[slot]) return 'Please choose a valid time slot.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
    return 'Please choose a valid date.';
  }
  if (date > todayStr()) return 'Date cannot be in the future.';
  return null;
}

module.exports = { SLOTS, validateBasic, todayStr };