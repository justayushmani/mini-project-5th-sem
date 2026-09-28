import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, ChevronRight, Trash2, Mic, ArrowRight } from 'lucide-react';
import bookmarkService from '../services/bookmark.service.js';
import { getErrorMessage } from '../utils/formatters.js';

export default function SavedSchemes() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSaved() {
      try {
        const data = await bookmarkService.getAll();
        setBookmarks(data.bookmarks || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    loadSaved();
  }, []);

  const handleRemove = async (schemeId) => {
    try {
      await bookmarkService.remove(schemeId);
      setBookmarks((prev) => prev.filter((item) => item.schemeId !== schemeId));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="container text-center" style={{ paddingTop: 80 }}>
          <div className="spinner" style={{ width: 38, height: 38 }} />
          <p className="mt-4 muted">Loading your saved schemes…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <BookMarked size={28} />
          <h1 style={{ margin: 0 }}>SAVED SCHEMES</h1>
        </div>

        <p className="muted" style={{ marginBottom: 24 }}>
          Keep track of the schemes you want to revisit later.
        </p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {!loading && bookmarks.length === 0 && (
          <div className="card" style={{ maxWidth: 560, margin: '24px auto 0', textAlign: 'center', padding: '32px 24px' }}>
            <h2>No saved schemes yet</h2>
            <p className="muted mt-4">Start by finding schemes that match your profile.</p>
            <Link to="/voice" className="btn btn-primary mt-8">
              <Mic size={18} /> Find Schemes
            </Link>
          </div>
        )}

        {bookmarks.length > 0 && (
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {bookmarks.map((bookmark) => {
              const scheme = bookmark.scheme;
              return (
                <article key={bookmark.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <span className="badge badge-grey">{scheme.category}</span>
                    {scheme.state && <span className="badge badge-blue">{scheme.state}</span>}
                  </div>

                  <div>
                    <h3 style={{ marginBottom: 8 }}>{scheme.name}</h3>
                    <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
                      {scheme.description?.slice(0, 160)}{scheme.description?.length > 160 ? '…' : ''}
                    </p>
                  </div>

                  {scheme.benefits?.[0] && (
                    <div className="badge badge-yellow" style={{ alignSelf: 'flex-start' }}>
                      {scheme.benefits[0].amount || scheme.benefits[0].description}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 'auto' }}>
                    <Link to={`/schemes/${scheme.id}`} className="btn btn-primary btn-sm">
                      View Scheme <ChevronRight size={16} />
                    </Link>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRemove(scheme.id)}>
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 28 }}>
          <Link to="/voice" className="btn btn-secondary">
            <ArrowRight size={18} /> Explore More Schemes
          </Link>
        </div>
      </div>
    </main>
  );
}
