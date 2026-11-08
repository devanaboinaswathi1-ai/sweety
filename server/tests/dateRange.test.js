process.env.NODE_ENV = 'test';
const { getRanges } = require('../src/routes/reports');

test('previous month for 15 Oct 2026 is 1 Sep to 30 Sep', () => {
  const r = getRanges('2026-10-15');
  expect(r.monthly.from).toBe('2026-09-01');
  expect(r.monthly.to).toBe('2026-09-30');
});

test('month-to-date for 15 Oct 2026 is 1 Oct to 15 Oct', () => {
  const r = getRanges('2026-10-15');
  expect(r.mtd.from).toBe('2026-10-01');
  expect(r.mtd.to).toBe('2026-10-15');
});

test('daily is the selected date only', () => {
  const r = getRanges('2026-10-15');
  expect(r.daily.from).toBe('2026-10-15');
  expect(r.daily.to).toBe('2026-10-15');
});

test('January rolls back to December of previous year', () => {
  const r = getRanges('2026-01-10');
  expect(r.monthly.from).toBe('2025-12-01');
  expect(r.monthly.to).toBe('2025-12-31');
});