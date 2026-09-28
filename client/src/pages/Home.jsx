import { Link } from 'react-router-dom';
import { Mic, Search, Shield, Zap, Globe, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import styles from './Home.module.css';

const FEATURES = [
  {
    icon: <Mic size={28} />,
    title: 'Speak Naturally',
    desc: 'Tell us about yourself in Hindi, English, or Hinglish. No forms to fill.',
  },
  {
    icon: <Zap size={28} />,
    title: 'Instant Matching',
    desc: 'AI extracts your profile and matches it against hundreds of government schemes.',
  },
  {
    icon: <Shield size={28} />,
    title: 'Verified Sources',
    desc: 'Every scheme links to official government sources. No fabricated information.',
  },
  {
    icon: <Globe size={28} />,
    title: 'All States Covered',
    desc: 'Central schemes + state-specific schemes across all 28 states and 8 UTs.',
  },
];

const SCHEME_PREVIEW = [
  { category: 'AGRICULTURE', name: 'PM-KISAN Samman Nidhi', benefit: '₹6,000/year', color: '#DCFCE7', borderColor: 'var(--green)' },
  { category: 'HEALTH',      name: 'Ayushman Bharat PM-JAY', benefit: '₹5 Lakh/year', color: '#DBEAFE', borderColor: 'var(--blue)' },
  { category: 'HOUSING',     name: 'PM Awas Yojana', benefit: 'Up to ₹2.67 Lakh', color: '#EDE9FE', borderColor: 'var(--purple)' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <main className={styles.main}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span>🇮🇳</span> AI-Powered Government Scheme Discovery
            </div>
            <h1 className={styles.heroTitle}>
              GOVERNMENT<br />SCHEMES,<br />
              <span className={styles.heroAccent}>FOR YOU.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Speak or type in your language. We'll find every scheme you're eligible for —
              from the thousands the government offers.
            </p>
            <div className={styles.heroCta}>
              <Link
                to={user ? '/voice' : '/register'}
                className="btn btn-primary btn-lg"
                id="hero-cta-voice"
              >
                <Mic size={22} /> Find Schemes With Your Voice
              </Link>
              <Link
                to={user ? '/voice' : '/login'}
                className="btn btn-secondary btn-lg"
                id="hero-cta-manual"
              >
                <Search size={20} /> Search Manually
              </Link>
            </div>
            {!user && (
              <p className={styles.heroNote}>
                Free to use · No credit card · Speak in Hindi or English
              </p>
            )}
          </div>

          {/* Floating scheme cards */}
          <div className={styles.heroCards} aria-hidden="true">
            {SCHEME_PREVIEW.map((s, i) => (
              <div
                key={s.name}
                className={styles.floatCard}
                style={{
                  background: s.color,
                  borderColor: s.borderColor,
                  animationDelay: `${i * 0.15}s`,
                }}
              >
                <span className="badge badge-grey">{s.category}</span>
                <p className={styles.floatCardName}>{s.name}</p>
                <p className={styles.floatCardBenefit}>{s.benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative shapes */}
        <div className={styles.shapeYellow} aria-hidden="true" />
        <div className={styles.shapeBlue}   aria-hidden="true" />
      </section>

      {/* ── How it works ── */}
      <section className={styles.howSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>HOW IT WORKS</h2>
          <div className={styles.stepsRow}>
            {['Tell us about yourself', 'AI extracts your profile', 'Review & confirm', 'Get your schemes'].map((step, i) => (
              <div key={step} className={styles.step}>
                <div className={styles.stepNum}>{i + 1}</div>
                <p className={styles.stepLabel}>{step}</p>
                {i < 3 && <ChevronRight size={20} className={styles.stepArrow} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.featuresSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>WHY YOJANA SAATHI</h2>
          <div className={`grid grid-2 gap-6 ${styles.featuresGrid}`}>
            {FEATURES.map((f) => (
              <div key={f.title} className={`card ${styles.featureCard}`}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.ctaBanner}>
        <div className="container text-center">
          <h2 className={styles.ctaTitle}>READY TO FIND YOUR SCHEMES?</h2>
          <p className={styles.ctaSub}>
            Takes less than 2 minutes. Speak naturally — we understand Hindi, English, and Hinglish.
          </p>
          <Link to={user ? '/voice' : '/register'} className="btn btn-primary btn-lg" id="bottom-cta">
            <Mic size={22} /> Get Started Free
          </Link>
        </div>
      </section>
    </main>
  );
}
