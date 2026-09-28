import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, FileText, CheckCircle, BookMarked, ArrowLeft, MessageCircle, AlertTriangle } from 'lucide-react';
import schemeService from '../services/scheme.service.js';
import bookmarkService from '../services/bookmark.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, getErrorMessage } from '../utils/formatters.js';
import styles from './SchemeDetails.module.css';

export default function SchemeDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [scheme, setScheme]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [saved, setSaved]         = useState(false);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await schemeService.getScheme(id);
        setScheme(data.scheme || data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleBookmark = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (saved) {
        await bookmarkService.remove(scheme.id);
        setSaved(false);
      } else {
        await bookmarkService.add(scheme.id);
        setSaved(true);
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
          <p className="mt-4 muted">Loading scheme details…</p>
        </div>
      </main>
    );
  }

  if (error || !scheme) {
    return (
      <main className="page">
        <div className="container text-center" style={{ paddingTop: 80 }}>
          <AlertTriangle size={48} color="var(--coral)" />
          <h2 className="mt-4">{error || 'Scheme not found'}</h2>
          <Link to="/" className="btn btn-primary mt-8">← Back Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={`page ${styles.page}`}>
      <div className="container container-md">
        {/* Back nav */}
        <Link to="/" className={styles.backLink}><ArrowLeft size={18} /> Back to Schemes</Link>

        {/* Header */}
        <div className={styles.header}>
          <span className={`badge ${categoryBadge(scheme.category)}`}>{scheme.category}</span>
          {scheme.level && <span className="badge badge-grey">{scheme.level}</span>}
          {scheme.state && <span className="badge badge-blue">{scheme.state}</span>}
        </div>

        <h1 className={styles.title}>{scheme.name}</h1>
        {scheme.ministry && <p className={styles.ministry}>{scheme.ministry}</p>}

        {/* Actions */}
        <div className={styles.actions}>
          {scheme.officialUrl && (
            <a href={scheme.officialUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <ExternalLink size={18} /> Apply on Official Website
            </a>
          )}
          {user && (
            <button className={`btn ${saved ? 'btn-danger' : 'btn-secondary'}`} onClick={handleBookmark} disabled={saving}>
              <BookMarked size={18} /> {saved ? 'Saved' : 'Save Scheme'}
            </button>
          )}
          {user && (
            <Link to={`/chat?schemeId=${scheme.id}`} className="btn btn-secondary">
              <MessageCircle size={18} /> Ask Questions
            </Link>
          )}
        </div>

        <hr className="divider" />

        {/* Overview */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>OVERVIEW</h2>
          <p className={styles.description}>{scheme.description}</p>
        </section>

        {/* Benefits */}
        {scheme.benefits?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>BENEFITS</h2>
            <div className={styles.benefitsList}>
              {scheme.benefits.map((b) => (
                <div key={b.id} className={styles.benefitCard}>
                  <span className={`badge badge-green`}>{b.benefitType}</span>
                  <p className={styles.benefitDesc}>{b.description}</p>
                  {b.amount && <p className={styles.benefitAmount}>{b.amount}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Eligibility */}
        {scheme.eligibility?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>WHO CAN APPLY?</h2>
            <ul className={styles.eligList}>
              {scheme.eligibility.map((e) => (
                <li key={e.id} className={styles.eligItem}>
                  <CheckCircle size={18} color={e.isRequired ? 'var(--green)' : 'var(--grey-500)'} />
                  <span>
                    {e.description}
                    {!e.isRequired && <span className={styles.optionalTag}> (Optional)</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Required Documents */}
        {scheme.documents?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>REQUIRED DOCUMENTS</h2>
            <ul className={styles.docList}>
              {scheme.documents.map((d) => (
                <li key={d.id} className={styles.docItem}>
                  <FileText size={18} />
                  <span>
                    {d.documentName}
                    {d.description && <span className="muted"> — {d.description}</span>}
                    {!d.isRequired && <span className={styles.optionalTag}> (Optional)</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* How to apply */}
        {scheme.applicationProcess && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>HOW TO APPLY</h2>
            <p className={styles.description}>{scheme.applicationProcess}</p>
          </section>
        )}

        {/* Source */}
        {scheme.source && (
          <section className={styles.sourceSection}>
            <h2 className={styles.sectionTitle}>OFFICIAL SOURCE</h2>
            <div className={styles.sourceCard}>
              <p><strong>{scheme.source.sourceName}</strong></p>
              <a href={scheme.source.sourceUrl} target="_blank" rel="noopener noreferrer">
                {scheme.source.sourceUrl} <ExternalLink size={14} />
              </a>
              {scheme.source.lastVerifiedAt && (
                <p className="muted text-sm mt-2">
                  Last verified: {formatDate(scheme.source.lastVerifiedAt)}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <div className={styles.disclaimer}>
          <AlertTriangle size={16} />
          <p>
            Information shown is based on publicly available government data.
            Always verify eligibility and details on the official scheme website before applying.
          </p>
        </div>
      </div>
    </main>
  );
}

function categoryBadge(cat) {
  const map = {
    Agriculture: 'badge-green',
    Health: 'badge-coral',
    Housing: 'badge-purple',
    Education: 'badge-blue',
    'Social Welfare': 'badge-orange',
    'Skill Development': 'badge-yellow',
  };
  return map[cat] || 'badge-grey';
}
