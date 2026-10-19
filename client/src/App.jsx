import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { ChatProvider, useChat } from './context/ChatContext.jsx';
import Navbar from './components/navbar/Navbar.jsx';
import FloatingChat from './components/chatbot/FloatingChat.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import VoiceInput from './pages/VoiceInput.jsx';
import Recommendations from './pages/Recommendations.jsx';
import SchemeDetails from './pages/SchemeDetails.jsx';
import SavedSchemes from './pages/SavedSchemes.jsx';
import DocSimplifier from './pages/DocSimplifier.jsx';
import ProtectedRoute from './components/ui/ProtectedRoute.jsx';

function ChatRedirect() {
  const { sessionId } = useParams();
  const { openChat } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    openChat({ sessionId: sessionId || null });
    navigate('/', { replace: true });
  }, [sessionId, openChat, navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <ChatProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
              <Navbar />
              <Routes>
                {/* Public routes */}
                <Route path="/"               element={<Home />} />
                <Route path="/login"          element={<Login />} />
                <Route path="/register"       element={<Register />} />
                <Route path="/schemes/:id"    element={<SchemeDetails />} />
                <Route path="/doc-simplifier" element={<DocSimplifier />} />

                {/* Protected routes */}
                <Route path="/voice"   element={<ProtectedRoute><VoiceInput /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
                <Route path="/saved"   element={<ProtectedRoute><SavedSchemes /></ProtectedRoute>} />
                
                {/* Chat redirect to floating Saathi widget */}
                <Route path="/chat"    element={<ChatRedirect />} />
                <Route path="/chat/:sessionId" element={<ChatRedirect />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Floating Saathi Chatbot Widget (Bottom-Left) */}
              <FloatingChat />
            </div>
          </ChatProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
