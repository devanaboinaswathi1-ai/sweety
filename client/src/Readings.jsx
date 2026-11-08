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
  const [editingId, setEditingId] = useState(null);
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

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api(`/readings/${editingId}`, { method: 'PUT', body: form });
        setEditingId(null);
      } else {
        await api('/readings', { method: 'POST', body: form });
      }
      setForm({ ...form, value: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(r) {
    setError('');
    setEditingId(r.id);
    setForm({ date: r.date, slot: r.slot, value: String(r.value) });
  }

  function cancelEdit() {
    setEditingId(null);
    setError('');
    setForm({ date: today(), slot: 'morning', value: '' });
  }

  async function remove(id) {
    if (!window.confirm('Delete this reading?')) return;
    setError('');
    try {
      await api(`/readings/${id}`, { method: 'DELETE' });
      if (editingId === id) cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>{editingId ? 'Edit reading' : 'Add reading'}</h2>
      <form onSubmit={save}>
        <input name="date" type="date" value={form.date} max={today()} onChange={change} />{' '}
        <select name="slot" value={form.slot} onChange={change}>
          {Object.entries(SLOTS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>{' '}
        <input name="value" type="number" placeholder="mg/dl" value={form.value} onChange={change} />{' '}
        <button type="submit">{editingId ? 'Save' : 'Add'}</button>{' '}
        {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
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
              <button onClick={() => startEdit(r)}>Edit</button>{' '}
              <button onClick={() => remove(r.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}