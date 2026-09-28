import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import Navbar from './components/navbar/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import VoiceInput from './pages/VoiceInput.jsx';
import Recommendations from './pages/Recommendations.jsx';
import SchemeDetails from './pages/SchemeDetails.jsx';
import SavedSchemes from './pages/SavedSchemes.jsx';
import Chat from './pages/Chat.jsx';
import ProtectedRoute from './components/ui/ProtectedRoute.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Routes>
              {/* Public routes */}
              <Route path="/"            element={<Home />} />
              <Route path="/login"       element={<Login />} />
              <Route path="/register"    element={<Register />} />
              <Route path="/schemes/:id" element={<SchemeDetails />} />

              {/* Protected routes */}
              <Route path="/voice"   element={<ProtectedRoute><VoiceInput /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
              <Route path="/saved"   element={<ProtectedRoute><SavedSchemes /></ProtectedRoute>} />
              <Route path="/chat"    element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/chat/:sessionId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
