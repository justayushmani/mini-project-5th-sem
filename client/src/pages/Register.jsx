import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../utils/formatters.js';
import styles from './Auth.module.css';

export default function Register() {
  const { t } = useTranslation();
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw]   = useState(false);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const { register }          = useAuth();
  const navigate              = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '', general: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())            errs.name = t('auth.nameRequired');
    if (!form.email.trim())           errs.email = t('auth.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = t('auth.emailInvalid');
    if (!form.password)               errs.password = t('auth.passwordRequired');
    else if (form.password.length < 8) errs.password = t('auth.passwordMinLength');
    if (form.password !== form.confirmPassword) errs.confirmPassword = t('auth.passwordMismatch');
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/voice');
    } catch (err) {
      setErrors({ general: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`page ${styles.authPage}`}>
      <div className="container container-sm">
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>{t('auth.createAccount')}<br />{t('auth.account')}</h1>
            <p>{t('auth.freeForever')}</p>
          </div>

          {errors.general && <div className="alert alert-error" role="alert">{errors.general}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">{t('auth.fullNameLabel')}</label>
              <input id="name" name="name" type="text" className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder={t('auth.fullNamePlaceholder')} value={form.name} onChange={handleChange}
                autoComplete="name" required aria-required="true" aria-describedby={errors.name ? 'name-err' : undefined} />
              {errors.name && <span id="name-err" className="form-error" role="alert">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label htmlFor="reg-email" className="form-label">{t('auth.emailLabel')}</label>
              <input id="reg-email" name="email" type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com" value={form.email} onChange={handleChange}
                autoComplete="email" required aria-required="true" aria-describedby={errors.email ? 'email-err' : undefined} />
              {errors.email && <span id="email-err" className="form-error" role="alert">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label htmlFor="reg-password" className="form-label">{t('auth.passwordLabel')}</label>
              <div className={styles.passwordWrapper}>
                <input id="reg-password" name="password" type={showPw ? 'text' : 'password'}
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder={t('auth.passwordMinChars')} value={form.password} onChange={handleChange}
                  autoComplete="new-password" required aria-required="true" />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="form-error" role="alert">{errors.password}</span>}
            </div>

            {/* Confirm password */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label htmlFor="confirmPassword" className="form-label">{t('auth.confirmPasswordLabel')}</label>
              <input id="confirmPassword" name="confirmPassword" type={showPw ? 'text' : 'password'}
                className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder={t('auth.confirmPasswordPlaceholder')} value={form.confirmPassword} onChange={handleChange}
                autoComplete="new-password" required />
              {errors.confirmPassword && <span className="form-error" role="alert">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }}
              disabled={loading} id="register-submit">
              {loading
                ? <><span className="spinner" style={{width:18,height:18}} /> {t('auth.creatingAccount')}</>
                : <><UserPlus size={18} /> {t('auth.createFreeAccount')}</>}
            </button>
          </form>

          <p className={styles.authSwitch}>
            {t('auth.alreadyHaveAccount')} <Link to="/login">{t('auth.signInLink')}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
