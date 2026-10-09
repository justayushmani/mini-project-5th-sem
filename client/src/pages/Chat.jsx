import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, Send, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import chatService from '../services/chat.service.js';
import styles from './Chat.module.css';

export default function Chat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(sessionId || null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (sessionId) {
      setActiveSessionId(sessionId);
      loadSession(sessionId);
    } else if (sessions[0]?.id) {
      setActiveSessionId(sessions[0].id);
      loadSession(sessions[0].id);
    } else {
      setMessages([]);
    }
  }, [sessionId, sessions]);

  async function loadSessions() {
    try {
      const list = await chatService.getSessions();
      setSessions(list);
      if (!sessionId && list[0]?.id) {
        navigate(`/chat/${list[0].id}`, { replace: true });
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load chat sessions.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSession(id) {
    try {
      const session = await chatService.getSession(id);
      setMessages(session.messages || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load this chat.');
      setMessages([]);
    }
  }

  const selectedSession = useMemo(
    () => sessions.find((item) => item.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  async function handleSendMessage(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError('');

    try {
      const data = await chatService.sendMessage(activeSessionId, text, null);
      const nextSessionId = data.sessionId;
      setActiveSessionId(nextSessionId);
      navigate(`/chat/${nextSessionId}`, { replace: true });
      setMessages(data.messages || []);
      setDraft('');
      await loadSessions();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to send message.');
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteSession(sessionIdToDelete) {
    if (!sessionIdToDelete) return;
    try {
      await chatService.deleteSession(sessionIdToDelete);
      const nextSessions = sessions.filter((item) => item.id !== sessionIdToDelete);
      setSessions(nextSessions);

      if (activeSessionId === sessionIdToDelete) {
        if (nextSessions[0]?.id) {
          const nextId = nextSessions[0].id;
          setActiveSessionId(nextId);
          navigate(`/chat/${nextId}`, { replace: true });
        } else {
          setActiveSessionId(null);
          navigate('/chat', { replace: true });
          setMessages([]);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete the chat.');
    }
  }

  return (
    <main className="page" style={{ padding: '24px 0 40px' }}>
      <div className="container" style={{ maxWidth: 1200 }}>
        <div className={styles.shell}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div>
                <p className="eyebrow">Assistant</p>
                <h2>Chats</h2>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  navigate('/chat');
                  setActiveSessionId(null);
                  setMessages([]);
                }}
              >
                <MessageCircle size={16} /> New
              </button>
            </div>

            <div className={styles.sessionList}>
              {sessions.length === 0 && !loading && (
                <p className={styles.empty}>No chats yet. Ask a question to begin.</p>
              )}

              {sessions.map((session) => (
                <button
                  key={session.id}
                  className={`${styles.sessionCard} ${activeSessionId === session.id ? styles.sessionCardActive : ''}`}
                  onClick={() => navigate(`/chat/${session.id}`)}
                >
                  <div>
                    <strong>{session.title || 'New Chat'}</strong>
                    <small>{new Date(session.updatedAt).toLocaleDateString()}</small>
                  </div>
                  <Trash2
                    size={14}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                  />
                </button>
              ))}
            </div>
          </aside>

          <section className={styles.chatPanel}>
            {selectedSession || activeSessionId ? (
              <>
                <header className={styles.chatHeader}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { navigate('/chat'); setActiveSessionId(null); setMessages([]); }}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <div>
                    <p className="eyebrow">Active chat</p>
                    <h3>{selectedSession?.title || 'New Chat'}</h3>
                  </div>
                </header>

                <div className={styles.messageList}>
                  {messages.length === 0 && (
                    <div className={styles.placeholder}>Ask a question about welfare schemes and benefits.</div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`${styles.messageRow} ${message.role === 'user' ? styles.userRow : styles.assistantRow}`}
                    >
                      <div className={styles.bubble}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <Sparkles size={42} />
                <h1>Ask Yojana Saathi</h1>
                <p>Ask about schemes, benefits, eligibility, or where to apply.</p>
              </div>
            )}

            <form className={styles.inputBar} onSubmit={handleSendMessage}>
              <textarea
                rows={1}
                placeholder="Ask about schemes, eligibility, or support programs..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button className="btn btn-primary" type="submit" disabled={sending || !draft.trim()}>
                {sending ? 'Sending...' : <><Send size={16} /> Send</>}
              </button>
            </form>

            {error && <div className="alert alert-error mt-4">{error}</div>}
          </section>
        </div>
      </div>
    </main>
  );
}
