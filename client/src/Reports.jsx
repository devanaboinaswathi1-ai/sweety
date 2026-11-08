import { useState, useEffect } from 'react';
import { api } from './api';

const today = () => new Date().toLocaleDateString('en-CA');

function Card({ title, data }) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12, margin: '12px 0' }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <small>{data.from === data.to ? data.from : `${data.from} to ${data.to}`}</small>
      {data.count === 0 ? (
        <p>No readings for this period.</p>
      ) : (
        <p>
          Highest: <b>{data.highest}</b> | Lowest: <b>{data.lowest}</b> | Average:{' '}
          <b>{data.average}</b> | Readings: <b>{data.count}</b>
        </p>
      )}
    </div>
  );
}

export default function Reports({ refreshKey }) {
  const [date, setDate] = useState(today());
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api(`/reports?date=${date}`)
      .then(setReport)
      .catch((err) => setError(err.message));
  }, [date, refreshKey]);

  return (
    <div>
      <h2>Reports</h2>
      <label>
        Selected date:{' '}
        <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
      </label>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {report && (
        <>
          <Card title="Daily" data={report.daily} />
          {report.daily.readings.length > 0 && (
            <ul>
              {report.daily.readings.map((r) => (
                <li key={r.id}>{r.slotLabel}: <b>{r.value}</b> mg/dl</li>
              ))}
            </ul>
          )}
          <Card title="Month-to-date" data={report.monthToDate} />
          <Card title="Previous month" data={report.monthly} />
        </>
      )}
    </div>
  );
}