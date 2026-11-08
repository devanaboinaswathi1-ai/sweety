process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

beforeEach(() => pool.query('TRUNCATE readings, users RESTART IDENTITY CASCADE'));
afterAll(() => pool.end());

async function signup(email = 'a@test.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Tester', email, password: 'secret123' });
  return res.body.token;
}

const add = (token, body) =>
  request(app).post('/api/readings').set('Authorization', `Bearer ${token}`).send(body);

test('rejects an empty value', async () => {
  const token = await signup();
  const res = await add(token, { date: '2026-11-01', slot: 'morning' });
  expect(res.status).toBe(400);
  expect(res.body.error).toBe('Please enter a glucose value.');
});

test('rejects values outside 40 to 600', async () => {
  const token = await signup();
  for (const value of [39, 601]) {
    const res = await add(token, { date: '2026-11-01', slot: 'morning', value });
    expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
  }
});

test('rejects a decimal value', async () => {
  const token = await signup();
  const res = await add(token, { date: '2026-11-01', slot: 'morning', value: 100.5 });
  expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
});

test('rejects a future date', async () => {
  const token = await signup();
  const res = await add(token, { date: '2999-01-01', slot: 'morning', value: 100 });
  expect(res.body.error).toBe('Date cannot be in the future.');
});

test('rejects a duplicate slot on the same date', async () => {
  const token = await signup();
  await add(token, { date: '2026-11-01', slot: 'after_lunch', value: 120 });
  const res = await add(token, { date: '2026-11-01', slot: 'after_lunch', value: 130 });
  expect(res.status).toBe(400);
  expect(res.body.error).toBe('You already have an After lunch reading for this date.');
});

test('another user cannot delete my reading', async () => {
  const tokenA = await signup('a@test.com');
  const tokenB = await signup('b@test.com');
  const created = await add(tokenA, { date: '2026-11-01', slot: 'morning', value: 100 });
  const res = await request(app)
    .delete(`/api/readings/${created.body.id}`)
    .set('Authorization', `Bearer ${tokenB}`);
  expect(res.status).toBe(404);
});