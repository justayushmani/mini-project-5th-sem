import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Bot, 
  Send, 
  X, 
  Plus, 
  Trash2, 
  History, 
  Sparkles, 
  LogIn, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import chatService from '../../services/chat.service.js';
import styles from './FloatingChat.module.css';

export default function FloatingChat() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const starterQuestions = [
    t('chat.starter1'),
    t('chat.starter2'),
    t('chat.starter3'),
    t('chat.starter4')
  ];
  const {
    isOpen,
    toggleChat,
    closeChat,
    activeSessionId,
    setActiveSessionId,
    schemeContext,
    clearSchemeContext,
    pendingPrompt,
    clearPendingPrompt
  } = useChat();

  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, sending, scrollToBottom]);

  // Load chat sessions when widget is opened and user is logged in
  useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;
    async function initSessions() {
      try {
        setLoading(true);
        const list = await chatService.getSessions();
        if (!isMounted) return;
        setSessions(list || []);

        if (activeSessionId) {
          loadSession(activeSessionId);
        } else if (list && list.length > 0) {
          // If we don't have an active session, open the latest one
          setActiveSessionId(list[0].id);
          loadSession(list[0].id);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err?.response?.data?.message || 'Unable to load chat history.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initSessions();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user, activeSessionId, setActiveSessionId]);

  // Handle pending prompt from external callers (like SchemeDetails "Ask Questions")
  useEffect(() => {
    if (pendingPrompt && isOpen) {
      setDraft(pendingPrompt);
      clearPendingPrompt();
      textareaRef.current?.focus();
    }
  }, [pendingPrompt, isOpen, clearPendingPrompt]);

  async function loadSession(id) {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const session = await chatService.getSession(id);
      setMessages(session.messages || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load conversation.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectSession(id) {
    setActiveSessionId(id);
    loadSession(id);
    setShowHistory(false);
  }

  function handleStartNewChat() {
    setActiveSessionId(null);
    setMessages([]);
    clearSchemeContext();
    setShowHistory(false);
    setError('');
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  async function handleDeleteSession(e, sessionIdToDelete) {
    e.stopPropagation();
    if (!sessionIdToDelete) return;
    try {
      await chatService.deleteSession(sessionIdToDelete);
      const nextSessions = sessions.filter((s) => s.id !== sessionIdToDelete);
      setSessions(nextSessions);

      if (activeSessionId === sessionIdToDelete) {
        if (nextSessions.length > 0) {
          setActiveSessionId(nextSessions[0].id);
          loadSession(nextSessions[0].id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete chat.');
    }
  }

  async function handleSendMessage(customText = null) {
    const textToSend = (typeof customText === 'string' ? customText : draft).trim();
    if (!textToSend || sending || !user) return;

    setSending(true);
    setError('');

    // Optimistically show user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setDraft('');

    try {
      const data = await chatService.sendMessage(
        activeSessionId, 
        textToSend, 
        schemeContext?.id || null
      );

      setActiveSessionId(data.sessionId);
      setMessages(data.messages || []);
      
      // Refresh sessions in background
      chatService.getSessions().then((list) => setSessions(list || [])).catch(() => {});
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not get response from Saathi. Please try again.');
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChipClick = (question) => {
    handleSendMessage(question);
  };

  return (
    <div className={styles.container}>
      {/* ── Chat Window (Appears bottom-left when open) ── */}
      {isOpen && (
        <aside 
          className={styles.window} 
          role="dialog" 
          aria-label={t('chat.saathi')}
        >
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerAvatar}>
                <Bot size={20} />
                <span className={styles.headerStatusDot} title="Online" />
              </div>
              <div className={styles.headerInfo}>
                <h2 className={styles.headerTitle}>
                  {t('chat.saathi')}
                  <span className={styles.headerBadge}>{t('chat.aiLabel')}</span>
                </h2>
                <p className={styles.headerSubtitle}>
                  {user ? t('chat.yourCompanion') : t('chat.onlineGuide')}
                </p>
              </div>
            </div>

            <div className={styles.headerActions}>
              {user && (
                <>
                  <button
                    className={`${styles.headerBtn} ${showHistory ? styles.headerBtnActive : ''}`}
                    onClick={() => setShowHistory((prev) => !prev)}
                    title={showHistory ? t('chat.hideHistory') : t('chat.viewHistory')}
                    aria-label="Toggle chat history"
                  >
                    <History size={15} />
                  </button>
                  <button
                    className={styles.headerBtn}
                    onClick={handleStartNewChat}
                    title={t('chat.startNewChat')}
                    aria-label={t('chat.startNewChat')}
                  >
                    <Plus size={16} />
                  </button>
                </>
              )}
              <button
                className={styles.headerBtn}
                onClick={closeChat}
                title={t('common.close')}
                aria-label={t('common.close')}
              >
                <X size={16} />
              </button>
            </div>
          </header>

          {/* Scheme context banner (if asked from SchemeDetails page) */}
          {schemeContext?.title && (
            <div className={styles.contextBanner}>
              <span>{t('chat.schemeLabel')} <strong>{schemeContext.title}</strong></span>
              <button 
                className={styles.contextClearBtn} 
                onClick={clearSchemeContext}
                title={t('chat.clearSchemeFocus')}
                aria-label={t('chat.clearSchemeFocus')}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* History drawer (when toggled) */}
          {user && showHistory && (
            <div className={styles.historyPanel}>
              <div className={styles.historyHeader}>{t('chat.pastConversations')}</div>
              {sessions.length === 0 ? (
                <p style={{ fontSize: 12, color: '#777', margin: 0 }}>{t('chat.noPastConversations')}</p>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`${styles.historyItem} ${s.id === activeSessionId ? styles.historyItemActive : ''}`}
                    onClick={() => handleSelectSession(s.id)}
                  >
                    <span className={styles.historyTitle}>{s.title || t('chat.conversation')}</span>
                    <button
                      className={styles.historyDeleteBtn}
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      title={t('chat.deleteConversation')}
                      aria-label={t('chat.deleteConversation')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Body */}
          <div className={styles.body}>
            {!user ? (
              // Unauthenticated state
              <div className={styles.authPrompt}>
                <div className={styles.authIcon}>
                  <Bot size={28} />
                </div>
                <h3 className={styles.authTitle}>{t('chat.askAnything')}</h3>
                <p className={styles.authText}>
                  {t('chat.signInPrompt')}
                </p>
                <div className={styles.authActions}>
                  <Link 
                    to="/login" 
                    className={`${styles.authBtn} ${styles.authBtnPrimary}`}
                    onClick={closeChat}
                  >
                    <LogIn size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                    {t('chat.logIn')}
                  </Link>
                  <Link 
                    to="/register" 
                    className={`${styles.authBtn} ${styles.authBtnSecondary}`}
                    onClick={closeChat}
                  >
                    {t('common.register')}
                  </Link>
                </div>
              </div>
            ) : messages.length === 0 && !loading ? (
              // Empty state with starter prompts
              <div className={styles.emptyState}>
                <div className={styles.emptyMascot}>
                  <Sparkles size={26} color="var(--black)" />
                </div>
                <h3 className={styles.emptyHeading}>{t('chat.namaste')}</h3>
                <p className={styles.emptySub}>
                  {t('chat.emptySub')}
                </p>

                <div className={styles.starterList}>
                  {starterQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      className={styles.starterChip}
                      onClick={() => handleChipClick(q)}
                    >
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Message list
              <>
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id || index}
                      className={`${styles.messageRow} ${isUser ? styles.messageRowUser : styles.messageRowAssistant}`}
                    >
                      {!isUser && (
                        <div className={styles.avatarMini} title={t('chat.saathi')}>
                          <Bot size={14} />
                        </div>
                      )}
                      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}

                {/* Thinking / Sending animation */}
                {sending && (
                  <div className={`${styles.messageRow} ${styles.messageRowAssistant}`}>
                    <div className={styles.avatarMini}>
                      <Bot size={14} />
                    </div>
                    <div className={styles.thinkingBubble}>
                      <span>{t('chat.saathiThinking')}</span>
                      <div className={styles.dotsWrapper}>
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}

            {/* Error banner */}
            {error && (
              <div className={styles.errorBanner}>
                <span>{error}</span>
                <button 
                  onClick={() => setError('')} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Input Bar */}
          {user && (
            <form className={styles.inputForm} onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                rows={1}
                placeholder={t('chat.inputPlaceholder')}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                aria-label="Type your question for Saathi"
              />
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={sending || !draft.trim()}
                title={t('chat.sendMessage')}
                aria-label={t('chat.sendMessage')}
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </aside>
      )}

      {/* ── Floating Launcher Button in Bottom Left ── */}
      <button
        className={`${styles.triggerBtn} ${isOpen ? styles.triggerBtnActive : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? t('chat.closeAssistant') : t('chat.openAssistant')}
        aria-expanded={isOpen}
      >
        <div className={styles.iconWrapper}>
          {isOpen ? <X size={18} /> : <Bot size={18} />}
          {!isOpen && <span className={styles.onlineBadge} />}
        </div>
        <div className={styles.triggerLabel}>
          <span className={styles.brandName}>{t('chat.saathi')}</span>
          <span className={styles.brandSub}>{t('chat.aiAssistant')}</span>
        </div>
      </button>
    </div>
  );
}
