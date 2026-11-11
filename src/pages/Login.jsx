import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { homeFor } from '../utils';

export default function Login() {
  const { user, login } = useStore();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), pw);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="login-hero">
        <div className="logo big">ember<span>.</span></div>
        <h1>Dinner, but <em className="grad-text">electric.</em></h1>
        <p className="muted">
          Sign in to order, cook, or manage the restaurant. Contact your administrator if you need an account.
        </p>
        <div className="orbit">
          {['🍣', '🍔', '🌮', '🍹', '🍰', '🍝'].map((e, i) => (
            <span className="slot" style={{ '--i': i }} key={i}><i>{e}</i></span>
          ))}
        </div>
      </div>

      <div className="login-panel glass">
        <h2>Welcome back</h2>
        <motion.form key={error} animate={error ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }} onSubmit={submit}>
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@ember.com" required />
          </label>
          <label>Password
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" required />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} /></button>
        </motion.form>
      </div>
    </div>
  );
}