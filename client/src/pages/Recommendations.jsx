import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, XCircle, BookMarked, ExternalLink, ChevronRight, Mic } from 'lucide-react';
import recommendationService from '../services/recommendation.service.js';
import bookmarkService from '../services/bookmark.service.js';
import { getErrorMessage, STATUS_CONFIG, truncate } from '../utils/formatters.js';
import styles from './Recommendations.module.css';

export default function Recommendations() {
  const location = useLocation();
  const recommendationId = location.state?.recommendationId;

  const [rec, setRec]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    async function load() {
      if (!recommendationId) {
        setLoading(false);
        return;
      }
      try {
        const data = await recommendationService.getById(recommendationId);
        setRec(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [recommendationId]);

  const handleBookmark = async (schemeId) => {
    try {
      if (savedIds.has(schemeId)) {
        await bookmarkService.remove(schemeId);
        setSavedIds((prev) => { const s = new Set(prev); s.delete(schemeId); return s; });
      } else {
        await bookmarkService.add(schemeId);
        setSavedIds((prev) => new Set(prev).add(schemeId));
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="container text-center" style={{ paddingTop: 80 }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
          <p className="mt-4 muted">Loading your recommendations…</p>
        </div>
      </main>
    );
  }

  if (!recommendationId || error) {
    return (
      <main className="page">
        <div className="container text-center" style={{ paddingTop: 80 }}>
          <h2>No recommendations yet</h2>
          <p className="muted mt-4">Use your voice to tell us about yourself and find matching schemes.</p>
          <Link to="/voice" className="btn btn-primary mt-8"><Mic size={18} /> Find Schemes With Your Voice</Link>
        </div>
      </main>
    );
  }

  const eligible = rec?.schemes?.filter((s) => s.status === 'ELIGIBLE') || [];
  const possibly = rec?.schemes?.filter((s) => s.status === 'POSSIBLY_ELIGIBLE') || [];
  const notEligible = rec?.schemes?.filter((s) => s.status === 'NOT_ELIGIBLE') || [];

  return (
    <main className={`page ${styles.page}`}>
      <div className="container">
        <h1 className={styles.title}>YOUR<br />SCHEMES</h1>
        <p className={styles.subtitle}>
          Based on the information you provided, here are the schemes that may be relevant to you.
        </p>

        {/* Summary bar */}
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <CheckCircle size={20} color="var(--green)" />
            <span><strong>{eligible.length}</strong> Eligible</span>
          </div>
          <div className={styles.summaryItem}>
            <AlertCircle size={20} color="var(--orange)" />
            <span><strong>{possibly.length}</strong> Possibly Eligible</span>
          </div>
          <div className={styles.summaryItem}>
            <XCircle size={20} color="var(--coral)" />
            <span><strong>{notEligible.length}</strong> Not Eligible</span>
          </div>
        </div>

        {/* Eligible */}
        {eligible.length > 0 && (
          <SchemeSection title="ELIGIBLE SCHEMES" schemes={eligible} savedIds={savedIds} onBookmark={handleBookmark} />
        )}

        {/* Possibly Eligible */}
        {possibly.length > 0 && (
          <SchemeSection title="POSSIBLY ELIGIBLE" schemes={possibly} savedIds={savedIds} onBookmark={handleBookmark} />
        )}

        {/* Not Eligible */}
        {notEligible.length > 0 && (
          <details className={styles.notEligibleDetails}>
            <summary className={styles.notEligibleSummary}>
              <XCircle size={18} /> Show {notEligible.length} schemes you don't appear to qualify for
            </summary>
            <SchemeSection title="" schemes={notEligible} savedIds={savedIds} onBookmark={handleBookmark} />
          </details>
        )}

        <div className="text-center mt-8">
          <Link to="/voice" className="btn btn-secondary"><Mic size={18} /> Try Different Profile</Link>
        </div>
      </div>
    </main>
  );
}

function SchemeSection({ title, schemes, savedIds, onBookmark }) {
  return (
    <section className={styles.section}>
      {title && <h2 className={styles.sectionTitle}>{title}</h2>}
      <div className={styles.grid}>
        {schemes.map((rs) => (
          <SchemeCard key={rs.id} recScheme={rs} saved={savedIds.has(rs.schemeId)} onBookmark={onBookmark} />
        ))}
      </div>
    </section>
  );
}

function SchemeCard({ recScheme, saved, onBookmark }) {
  const { scheme, status, matchedCriteria, missingCriteria, explanation } = recScheme;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.POSSIBLY_ELIGIBLE;

  return (
    <div className={styles.card} style={{ borderLeftColor: config.color }}>
      <div className={styles.cardTop}>
        <span className={`badge ${config.badgeClass}`}>{config.label}</span>
        <span className="badge badge-grey">{scheme.category}</span>
      </div>

      <h3 className={styles.cardTitle}>{scheme.name}</h3>

      {/* Benefits preview */}
      {scheme.benefits?.[0] && (
        <p className={styles.cardBenefit}>{scheme.benefits[0].amount || scheme.benefits[0].description}</p>
      )}

      {/* Why this matches */}
      {matchedCriteria?.length > 0 && (
        <div className={styles.matchList}>
          <p className={styles.matchLabel}>WHY THIS MATCHES</p>
          {matchedCriteria.slice(0, 4).map((c, i) => (
            <p key={i} className={styles.matchItem}><CheckCircle size={14} color="var(--green)" /> {c}</p>
          ))}
        </div>
      )}

      {/* Missing info */}
      {missingCriteria?.length > 0 && (
        <div className={styles.missingList}>
          <p className={styles.matchLabel}>NEEDS VERIFICATION</p>
          {missingCriteria.slice(0, 2).map((c, i) => (
            <p key={i} className={styles.matchItem}><AlertCircle size={14} color="var(--orange)" /> {truncate(c, 80)}</p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className={styles.cardActions}>
        <Link to={`/schemes/${scheme.id}`} className="btn btn-primary btn-sm">
          View Scheme <ChevronRight size={16} />
        </Link>
        <button className={`btn btn-ghost btn-sm`} onClick={() => onBookmark(scheme.id)}>
          <BookMarked size={16} fill={saved ? 'var(--black)' : 'none'} /> {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Source */}
      {scheme.source && (
        <p className={styles.cardSource}>
          Source: {scheme.source.sourceName}
        </p>
      )}
    </div>
  );
}
