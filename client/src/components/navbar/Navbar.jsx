import { Link, useNavigate } from 'react-router-dom';
import { Mic, BookMarked, MessageCircle, LogOut, LogIn, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { language, changeLanguage, languages } = useLanguage();
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
            aria-label="Select language"
          >
            {Object.values(languages).map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
            ))}
          </select>

          {user ? (
            <>
              <Link to="/voice" className="btn btn-primary btn-sm">
                <Mic size={16} /> Find Schemes
              </Link>
              <Link to="/saved" className={styles.navLink} aria-label="Saved schemes">
                <BookMarked size={18} />
              </Link>
              <Link to="/chat" className={styles.navLink} aria-label="Chat">
                <MessageCircle size={18} />
              </Link>
              <Link to="/profile" className={styles.navLink} aria-label="Profile">
                <User size={18} />
              </Link>
              <button onClick={handleLogout} className={`btn btn-secondary btn-sm`} aria-label="Logout">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn btn-secondary btn-sm"><LogIn size={16} /> Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
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
            aria-label="Select language"
          >
            {Object.values(languages).map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
            ))}
          </select>

          {user ? (
            <>
              <Link to="/voice"   className={styles.mobileLink} onClick={() => setMenuOpen(false)}><Mic size={18} /> Find Schemes</Link>
              <Link to="/profile" className={styles.mobileLink} onClick={() => setMenuOpen(false)}><User size={18} /> Profile</Link>
              <Link to="/saved"   className={styles.mobileLink} onClick={() => setMenuOpen(false)}><BookMarked size={18} /> Saved Schemes</Link>
              <Link to="/chat"    className={styles.mobileLink} onClick={() => setMenuOpen(false)}><MessageCircle size={18} /> Chat</Link>
              <button onClick={handleLogout} className={styles.mobileLink}><LogOut size={18} /> Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"    className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
