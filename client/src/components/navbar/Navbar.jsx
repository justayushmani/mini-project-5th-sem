import { Link, useNavigate } from 'react-router-dom';
import { Mic, BookMarked, MessageCircle, LogOut, LogIn, Menu, X, User, FileText } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { language, changeLanguage, languages } = useLanguage();
  const { toggleChat, openChat } = useChat();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link to="/" className={styles.logo} aria-label="Yojana Saathi Home">
          <span className={styles.logoText}>YOJANA</span>
          <span className={styles.logoAccent}>SAATHI</span>
        </Link>

        {/* Desktop nav */}
        <div className={styles.desktopNav}>
          {/* Language selector */}
          <select
            className={styles.langSelect}
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            aria-label={t('nav.selectLanguage')}
          >
            {Object.values(languages).map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
            ))}
          </select>

          <Link to="/doc-simplifier" className={styles.navLink} aria-label={t('nav.docSimplifier')} title={t('nav.simplifyDocument')}>
            <FileText size={18} />
          </Link>

          {user ? (
            <>
              <Link to="/voice" className="btn btn-primary btn-sm">
                <Mic size={16} /> {t('common.findSchemes')}
              </Link>
              <Link to="/saved" className={styles.navLink} aria-label={t('nav.savedSchemes')} title={t('nav.savedSchemes')}>
                <BookMarked size={18} />
              </Link>
              <button
                type="button"
                onClick={toggleChat}
                className={styles.navLink}
                aria-label={t('nav.saathiAssistant')}
                title={t('nav.saathiAssistant')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <MessageCircle size={18} />
              </button>
              <Link to="/profile" className={styles.navLink} aria-label={t('nav.profile')} title={t('nav.profile')}>
                <User size={18} />
              </Link>
              <button onClick={handleLogout} className={`btn btn-secondary btn-sm`} aria-label={t('common.logout')}>
                <LogOut size={16} /> {t('common.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn btn-secondary btn-sm"><LogIn size={16} /> {t('common.login')}</Link>
              <Link to="/register" className="btn btn-primary btn-sm">{t('common.register')}</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu} role="menu">
          <select
            className={styles.langSelectMobile}
            value={language}
            onChange={(e) => { changeLanguage(e.target.value); }}
            aria-label={t('nav.selectLanguage')}
          >
            {Object.values(languages).map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
            ))}
          </select>

          <Link to="/doc-simplifier" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            <FileText size={18} /> {t('nav.docSimplifier')}
          </Link>

          {user ? (
            <>
              <Link to="/voice"   className={styles.mobileLink} onClick={() => setMenuOpen(false)}><Mic size={18} /> {t('common.findSchemes')}</Link>
              <Link to="/profile" className={styles.mobileLink} onClick={() => setMenuOpen(false)}><User size={18} /> {t('nav.profile')}</Link>
              <Link to="/saved"   className={styles.mobileLink} onClick={() => setMenuOpen(false)}><BookMarked size={18} /> {t('nav.savedSchemes')}</Link>
              <button
                type="button"
                className={styles.mobileLink}
                onClick={() => {
                  setMenuOpen(false);
                  openChat();
                }}
                style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <MessageCircle size={18} /> {t('nav.saathiAssistant')}
              </button>
              <button onClick={handleLogout} className={styles.mobileLink}><LogOut size={18} /> {t('common.logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login"    className={styles.mobileLink} onClick={() => setMenuOpen(false)}>{t('common.login')}</Link>
              <Link to="/register" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>{t('common.register')}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
