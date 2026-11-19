import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink, FileText, CheckCircle, BookMarked, ArrowLeft, MessageCircle, AlertTriangle } from 'lucide-react';
import schemeService from '../services/scheme.service.js';
import bookmarkService from '../services/bookmark.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useChat } from '../context/ChatContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatDate, getErrorMessage } from '../utils/formatters.js';
import styles from './SchemeDetails.module.css';

export default function SchemeDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const { openChat } = useChat();
  const { language } = useLanguage();
  const [scheme, setScheme]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [saved, setSaved]         = useState(false);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await schemeService.getScheme(id, language);
        setScheme(data.scheme || data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, language]);

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
          <p className="mt-4 muted">{t('schemeDetails.loadingScheme')}</p>
        </div>
      </main>
    );
  }

  if (error || !scheme) {
    return (
      <main className="page">
        <div className="container text-center" style={{ paddingTop: 80 }}>
          <AlertTriangle size={48} color="var(--coral)" />
          <h2 className="mt-4">{error || t('schemeDetails.schemeNotFound')}</h2>
          <Link to="/" className="btn btn-primary mt-8">← {t('schemeDetails.backToSchemes')}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={`page ${styles.page}`}>
      <div className="container container-md">
        {/* Back nav */}
        <Link to="/" className={styles.backLink}><ArrowLeft size={18} /> {t('schemeDetails.backToSchemes')}</Link>

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
              <ExternalLink size={18} /> {t('schemeDetails.applyOfficial')}
            </a>
          )}
          {user && (
            <button className={`btn ${saved ? 'btn-danger' : 'btn-secondary'}`} onClick={handleBookmark} disabled={saving}>
              <BookMarked size={18} /> {saved ? t('schemeDetails.saved') : t('schemeDetails.saveScheme')}
            </button>
          )}
          {user && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                openChat({
                  schemeId: scheme.id,
                  schemeTitle: scheme.name,
                  initialMessage: t('schemeDetails.askAbout', { name: scheme.name }),
                })
              }
            >
              <MessageCircle size={18} /> {t('schemeDetails.askQuestions')}
            </button>
          )}
        </div>

        <hr className="divider" />

        {/* Overview */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('schemeDetails.overview')}</h2>
          <p className={styles.description}>{scheme.description}</p>
        </section>

        {/* Benefits */}
        {scheme.benefits?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('schemeDetails.benefits')}</h2>
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
            <h2 className={styles.sectionTitle}>{t('schemeDetails.whoCanApply')}</h2>
            <ul className={styles.eligList}>
              {scheme.eligibility.map((e) => (
                <li key={e.id} className={styles.eligItem}>
                  <CheckCircle size={18} color={e.isRequired ? 'var(--green)' : 'var(--grey-500)'} />
                  <span>
                    {e.description}
                    {!e.isRequired && <span className={styles.optionalTag}> ({t('common.optional')})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Required Documents */}
        {scheme.documents?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('schemeDetails.requiredDocs')}</h2>
            <ul className={styles.docList}>
              {scheme.documents.map((d) => (
                <li key={d.id} className={styles.docItem}>
                  <FileText size={18} />
                  <span>
                    {d.documentName}
                    {d.description && <span className="muted"> — {d.description}</span>}
                    {!d.isRequired && <span className={styles.optionalTag}> ({t('common.optional')})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* How to apply */}
        {scheme.applicationProcess && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('schemeDetails.howToApply')}</h2>
            <p className={styles.description}>{scheme.applicationProcess}</p>
          </section>
        )}

        {/* Source */}
        {scheme.source && (
          <section className={styles.sourceSection}>
            <h2 className={styles.sectionTitle}>{t('schemeDetails.officialSource')}</h2>
            <div className={styles.sourceCard}>
              <p><strong>{scheme.source.sourceName}</strong></p>
              <a href={scheme.source.sourceUrl} target="_blank" rel="noopener noreferrer">
                {scheme.source.sourceUrl} <ExternalLink size={14} />
              </a>
              {scheme.source.lastVerifiedAt && (
                <p className="muted text-sm mt-2">
                  {t('schemeDetails.lastVerified', { date: formatDate(scheme.source.lastVerifiedAt) })}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <div className={styles.disclaimer}>
          <AlertTriangle size={16} />
          <p>
            {t('schemeDetails.disclaimer')}
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
