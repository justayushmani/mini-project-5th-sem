import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, ChevronRight, Edit3, CheckCircle } from 'lucide-react';
import { useVoice } from '../hooks/useVoice.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { SPEECH_LANG_MAP, STATES, OCCUPATIONS, CATEGORIES } from '../utils/constants.js';
import { formatCurrency, getErrorMessage } from '../utils/formatters.js';
import api from '../services/api.js';
import styles from './VoiceInput.module.css';

// Stages of the voice → profile → recommendations flow
const STAGE = {
  IDLE:         'IDLE',
  RECORDING:    'RECORDING',
  PROCESSING:   'PROCESSING',
  CONFIRM:      'CONFIRM',
  SUBMITTING:   'SUBMITTING',
};

export default function VoiceInput() {
  const { language } = useLanguage();
  const { user }     = useAuth();
  const navigate     = useNavigate();

  const [stage, setStage]           = useState(STAGE.IDLE);
  const [profile, setProfile]       = useState(null);
  const [extractError, setExtractError] = useState('');
  const [editMode, setEditMode]     = useState(false);

  const { isListening, transcript, isSupported, error: voiceError,
          startListening, stopListening, resetTranscript } = useVoice({
    language: SPEECH_LANG_MAP[language] || 'en-IN',
    onResult: handleFinalTranscript,
  });

  // When user stops speaking, extract the profile
  async function handleFinalTranscript(text) {
    if (!text.trim()) return;
    setStage(STAGE.PROCESSING);
    try {
      const res = await api.post('/ai/extract-profile', { text, language });
      setProfile(res.data.data);
      setStage(STAGE.CONFIRM);
    } catch (err) {
      setExtractError(getErrorMessage(err));
      setStage(STAGE.IDLE);
    }
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setExtractError('');
      startListening();
      setStage(STAGE.RECORDING);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const handleFindSchemes = async () => {
    setStage(STAGE.SUBMITTING);
    try {
      const res = await api.post('/recommendations', { profile });
      navigate(`/recommendations`, { state: { recommendationId: res.data.data.id } });
    } catch (err) {
      setExtractError(getErrorMessage(err));
      setStage(STAGE.CONFIRM);
    }
  };

  return (
    <main className={`page ${styles.page}`}>
      <div className="container container-md">

        {/* ── Stage: IDLE / RECORDING ── */}
        {(stage === STAGE.IDLE || stage === STAGE.RECORDING) && (
          <div className={styles.micSection}>
            <h1 className={styles.title}>TELL US<br />ABOUT<br />YOURSELF</h1>
            <p className={styles.subtitle}>
              Speak naturally in <strong>Hindi</strong>, <strong>English</strong>, or <strong>Hinglish</strong>.
              Include your age, state, occupation, and income.
            </p>

            {!isSupported && (
              <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
                Voice input isn't supported in this browser. Please type below instead.
              </div>
            )}

            {/* Microphone button */}
            <button
              className={`${styles.micBtn} ${isListening ? styles.micBtnActive : ''}`}
              onClick={handleMicClick}
              aria-label={isListening ? 'Stop recording' : 'Start recording'}
              aria-pressed={isListening}
              disabled={!isSupported}
              id="mic-button"
            >
              {isListening
                ? <><MicOff size={40} /><div className={styles.pulseRing} /></>
                : <Mic size={40} />}
            </button>

            <p className={styles.micHint}>
              {isListening ? '🔴 Listening…' : 'TAP TO START SPEAKING'}
            </p>

            {/* Live transcript */}
            {transcript && (
              <div className={styles.transcriptBox}>
                <p className={styles.transcriptLabel}>YOU SAID:</p>
                <p className={styles.transcriptText}>"{transcript}"</p>
              </div>
            )}

            {voiceError && <div className="alert alert-error mt-4">{voiceError}</div>}
            {extractError && <div className="alert alert-error mt-4">{extractError}</div>}

            {/* Manual text input fallback */}
            <details className={styles.manualFallback}>
              <summary>Or type instead</summary>
              <ManualTextInput onSubmit={handleFinalTranscript} />
            </details>
          </div>
        )}

        {/* ── Stage: PROCESSING ── */}
        {stage === STAGE.PROCESSING && (
          <div className={styles.processingSection}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            <h2>Understanding your profile…</h2>
            <p>This takes a few seconds.</p>
          </div>
        )}

        {/* ── Stage: CONFIRM ── */}
        {stage === STAGE.CONFIRM && profile && (
          <div className={styles.confirmSection}>
            <div className={styles.confirmHeader}>
              <CheckCircle size={32} color="var(--green)" />
              <h1 className={styles.title}>YOUR PROFILE</h1>
            </div>
            <p className={styles.subtitle}>
              Review the information below. Edit anything that looks wrong.
            </p>

            <div className={styles.profileGrid}>
              <ProfileField label="Age"           field="age"           value={profile.age}            type="number"  onChange={handleProfileChange} editMode={editMode} />
              <ProfileField label="State"          field="state"         value={profile.state}           type="select"  options={STATES}     onChange={handleProfileChange} editMode={editMode} />
              <ProfileField label="Occupation"     field="occupation"    value={profile.occupation}      type="select"  options={OCCUPATIONS} onChange={handleProfileChange} editMode={editMode} />
              <ProfileField label="Annual Income"  field="annualIncome"  value={profile.annualIncome}    type="number"  prefix="₹" onChange={handleProfileChange} editMode={editMode} />
              <ProfileField label="Gender"         field="gender"        value={profile.gender}          type="text"    onChange={handleProfileChange} editMode={editMode} />
              <ProfileField label="Category"       field="category"      value={profile.category}        type="select"  options={CATEGORIES} onChange={handleProfileChange} editMode={editMode} />
            </div>

            {extractError && <div className="alert alert-error mt-4">{extractError}</div>}

            <div className={styles.confirmActions}>
              <button className="btn btn-secondary" onClick={() => setEditMode(!editMode)} id="edit-profile-btn">
                <Edit3 size={18} /> {editMode ? 'Done Editing' : 'Edit Info'}
              </button>
              <button className="btn btn-primary btn-lg" onClick={handleFindSchemes}
                disabled={stage === STAGE.SUBMITTING} id="find-schemes-btn">
                {stage === STAGE.SUBMITTING
                  ? <><span className="spinner" style={{width:18,height:18}} /> Finding schemes…</>
                  : <><ChevronRight size={20} /> FIND MY SCHEMES</>}
              </button>
            </div>

            <button className="btn btn-ghost btn-sm" style={{marginTop:16}} onClick={() => { setStage(STAGE.IDLE); resetTranscript(); }}>
              ← Speak again
            </button>
          </div>
        )}

        {/* ── Stage: SUBMITTING ── */}
        {stage === STAGE.SUBMITTING && (
          <div className={styles.processingSection}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            <h2>Finding your schemes…</h2>
            <p>Checking eligibility across hundreds of schemes.</p>
          </div>
        )}
      </div>
    </main>
  );
}

/** Small sub-component for manual text fallback */
function ManualTextInput({ onSubmit }) {
  const [text, setText] = useState('');
  return (
    <div style={{ marginTop: 16 }}>
      <textarea
        className="input"
        rows={3}
        placeholder="e.g. I am a 35-year-old farmer from Uttar Pradesh. My annual income is 1.2 lakh."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ resize: 'vertical' }}
        aria-label="Type your information"
      />
      <button
        className="btn btn-primary"
        style={{ marginTop: 12, width: '100%' }}
        onClick={() => onSubmit(text)}
        disabled={!text.trim()}
        id="manual-submit-btn"
      >
        <ChevronRight size={18} /> Extract My Profile
      </button>
    </div>
  );
}

/** Profile field — editable or read-only */
function ProfileField({ label, field, value, type, options, prefix, onChange, editMode }) {
  return (
    <div className={styles.profileField}>
      <span className={styles.profileLabel}>{label.toUpperCase()}</span>
      {editMode ? (
        type === 'select' ? (
          <select className="input" value={value || ''} onChange={(e) => onChange(field, e.target.value)} aria-label={label}>
            <option value="">— Not specified —</option>
            {options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input className="input" type={type} value={value ?? ''} onChange={(e) => onChange(field, type === 'number' ? Number(e.target.value) : e.target.value)} aria-label={label} />
        )
      ) : (
        <span className={styles.profileValue}>
          {value == null ? <span className={styles.notSpecified}>Not specified</span>
            : prefix ? `${prefix}${Number(value).toLocaleString('en-IN')}` : String(value)}
        </span>
      )}
    </div>
  );
}
