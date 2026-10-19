import { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [schemeContext, setSchemeContext] = useState(null); // { id, title }
  const [pendingPrompt, setPendingPrompt] = useState('');

  const openChat = useCallback((options = {}) => {
    if (options.sessionId) {
      setActiveSessionId(options.sessionId);
    }
    if (options.schemeId || options.schemeTitle) {
      setSchemeContext({
        id: options.schemeId || null,
        title: options.schemeTitle || '',
      });
    }
    if (options.initialMessage) {
      setPendingPrompt(options.initialMessage);
    }
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearSchemeContext = useCallback(() => {
    setSchemeContext(null);
  }, []);

  const clearPendingPrompt = useCallback(() => {
    setPendingPrompt('');
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        activeSessionId,
        schemeContext,
        pendingPrompt,
        openChat,
        closeChat,
        toggleChat,
        setActiveSessionId,
        clearSchemeContext,
        clearPendingPrompt,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return ctx;
}
