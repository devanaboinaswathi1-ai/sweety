import { useState } from 'react';
import { api, setSession } from './api';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : form;
      const data = await api(path, { method: 'POST', body });
      setSession(data.token, data.user);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '60px auto', textAlign: 'left' }}>
      <h1>Sweety</h1>
      <h2>{mode === 'login' ? 'Log in' : 'Create account'}</h2>
      <form onSubmit={submit}>
        {mode === 'signup' && (
          <p>
            <input name="name" placeholder="Name" value={form.name}
              onChange={change} required style={{ width: '100%' }} />
          </p>
        )}
        <p>
          <input name="email" type="email" placeholder="Email" value={form.email}
            onChange={change} required style={{ width: '100%' }} />
        </p>
        <p>
          <input name="password" type="password" placeholder="Password"
            value={form.password} onChange={change} required
            style={{ width: '100%' }} />
        </p>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
      </form>
      <p>
        {mode === 'login' ? 'New here? ' : 'Already have an account? '}
        <a href="#" onClick={(e) => {
          e.preventDefault();
          setError('');
          setMode(mode === 'login' ? 'signup' : 'login');
        }}>
          {mode === 'login' ? 'Sign up' : 'Log in'}
        </a>
      </p>
    </div>
  );
}