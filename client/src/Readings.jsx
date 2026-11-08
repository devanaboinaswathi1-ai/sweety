import { useState, useEffect } from 'react';
import { api } from './api';

const SLOTS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

const today = () => new Date().toLocaleDateString('en-CA');

export default function Readings() {
  const [readings, setReadings] = useState([]);
  const [form, setForm] = useState({ date: today(), slot: 'morning', value: '' });
  const [error, setError] = useState('');

  async function load() {
    try {
      setReadings(await api('/readings'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function add(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/readings', { method: 'POST', body: form });
      setForm({ ...form, value: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this reading?')) return;
    setError('');
    try {
      await api(`/readings/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Add reading</h2>
      <form onSubmit={add}>
        <input name="date" type="date" value={form.date} max={today()} onChange={change} />{' '}
        <select name="slot" value={form.slot} onChange={change}>
          {Object.entries(SLOTS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>{' '}
        <input name="value" type="number" placeholder="mg/dl" value={form.value} onChange={change} />{' '}
        <button type="submit">Add</button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <h2>My readings</h2>
      {readings.length === 0 ? (
        <p>No readings yet. Add your first one above.</p>
      ) : (
        <ul>
          {readings.map((r) => (
            <li key={r.id}>
              {r.date} - {SLOTS[r.slot]}: <b>{r.value}</b> mg/dl{' '}
              <button onClick={() => remove(r.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}