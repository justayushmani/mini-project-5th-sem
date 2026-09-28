import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../utils/formatters.js';
import styles from './Auth.module.css';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/voice');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`page ${styles.authPage}`}>
      <div className={`container container-sm`}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>WELCOME<br />BACK</h1>
            <p>Sign in to find your government schemes.</p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
                aria-required="true"
              />
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label htmlFor="password" className="form-label">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  className="input"
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '24px' }}
              disabled={loading}
              id="login-submit"
            >
              {loading ? <><span className="spinner" style={{width:18,height:18}} /> Signing in…</> : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>

          <p className={styles.authSwitch}>
            Don't have an account?{' '}
            <Link to="/register">Create one free →</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
