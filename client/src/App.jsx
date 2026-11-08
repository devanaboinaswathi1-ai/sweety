import { useState } from 'react';
import Login from './Login';
import Readings from './Readings';
import Reports from './Reports';
import { getToken, getUser, clearSession } from './api';

export default function App() {
  const [user, setUser] = useState(getToken() ? getUser() : null);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div style={{ textAlign: 'left', padding: 24 }}>
      <h1>Sweety</h1>
      <p>Hello, {user.name}!</p>
      <button onClick={() => { clearSession(); setUser(null); }}>Log out</button>
      <Readings onChange={() => setRefreshKey((k) => k + 1)} />
      <Reports refreshKey={refreshKey} />
    </div>
  );
}