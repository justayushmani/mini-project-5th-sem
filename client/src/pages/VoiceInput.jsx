import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  ChevronRight, 
  Edit3, 
  CheckCircle, 
  Shield, 
  Sparkles, 
  ArrowLeft,
  Volume2
} from 'lucide-react';
import { useVoice } from '../hooks/useVoice.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { SPEECH_LANG_MAP, STATES, OCCUPATIONS, CATEGORIES } from '../utils/constants.js';
import { getErrorMessage } from '../utils/formatters.js';
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

// Illustrative example prompts for scheme discovery
const EXAMPLE_PROMPTS = [
  'I am a student from Uttar Pradesh looking for education support.',
  'I am a farmer and want to know about government assistance.',
  'I want to start a small business and explore available schemes.',
];

export default function VoiceInput() {
  const { language } = useLanguage();
  const { user }     = useAuth();
  const navigate     = useNavigate();

  const [stage, setStage]               = useState(STAGE.IDLE);
  const [profile, setProfile]           = useState(null);
  const [extractError, setExtractError] = useState('');
  const [editMode, setEditMode]         = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [manualText, setManualText]     = useState('');

  const textareaRef = useRef(null);

  const { isListening, transcript, isSupported, error: voiceError,
          startListening, stopListening, resetTranscript } = useVoice({
    language: SPEECH_LANG_MAP[language] || 'en-IN',
    onResult: handleFinalTranscript,
  });

  // When user stops speaking or submits text, extract the profile
  async function handleFinalTranscript(text) {
    if (!text || !text.trim()) return;
    setStage(STAGE.PROCESSING);
    setExtractError('');
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

  const handleUseExample = (example) => {
    setManualText(example);
    setShowTextInput(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleManualSubmit = () => {
    if (!manualText.trim()) return;
    handleFinalTranscript(manualText);
  };

  return (
    <main className={`page ${styles.page}`}>
      <div className={`container ${styles.container}`}>

        {/* ── STAGE 1: IDLE / RECORDING (Two-Column Layout) ── */}
        {(stage === STAGE.IDLE || stage === STAGE.RECORDING) && (
          <div className={styles.twoColGrid}>
            
            {/* ═════════════════════════════════════════════════════
                LEFT COLUMN: Main Interaction (55-60%)
                ═════════════════════════════════════════════════════ */}
            <div className={styles.leftCol}>
              
              {/* A. Editorial Heading */}
              <div className={styles.headingBlock}>
                <div className={styles.eyebrowBadge}>
                  YOUR NEXT STEP STARTS HERE
                </div>
                <h1 className={styles.mainTitle}>
                  LET'S FIND<br />
                  <span className={styles.highlightText}>WHAT'S RIGHT</span><br />
                  FOR YOU.
                </h1>
                <p className={styles.supportingCopy}>
                  Tell us a little about yourself. We'll help you discover government schemes that may match your circumstances.
                </p>
              </div>

              {/* B. Prominent Voice Panel */}
              <section className={styles.voiceCard} aria-label="Voice Input Section">
                <div className={styles.voiceCardHeader}>
                  <div>
                    <h2 className={styles.voiceCardTitle}>Speak about yourself</h2>
                    <p className={styles.voiceCardSub}>
                      Speak naturally in <strong>Hindi</strong>, <strong>English</strong>, or <strong>Hinglish</strong>
                    </p>
                  </div>
                  <span className={styles.langPill} title={`Current speech language: ${language}`}>
                    {language.toUpperCase()}
                  </span>
                </div>

                {!isSupported && (
                  <div className="alert alert-warning">
                    Voice input isn't supported in this browser. Please type below instead.
                  </div>
                )}

                {/* Microphone Control Button */}
                <div className={styles.micControlArea}>
                  <div className={styles.micRingWrapper}>
                    <button
                      className={`${styles.micButton} ${isListening ? styles.micButtonListening : ''}`}
                      onClick={handleMicClick}
                      aria-label={isListening ? 'Stop recording' : 'Start recording'}
                      aria-pressed={isListening}
                      disabled={!isSupported}
                      id="mic-button"
                    >
                      {isListening ? <MicOff size={44} /> : <Mic size={44} />}
                      {isListening && <div className={styles.pulseWaveRing} />}
                    </button>
                  </div>

                  {/* Dynamic Status Indicator */}
                  <div className={styles.micStatusLabel}>
                    {isListening ? (
                      <div className={styles.liveListeningRow}>
                        <span className={styles.liveRedDot} />
                        <span className={styles.liveListeningText}>Listening… Speak now</span>
                        {/* Audio Waveform only when microphone is actively listening */}
                        <div className={styles.soundWaveBars} aria-hidden="true">
                          <span className={styles.bar} />
                          <span className={styles.bar} />
                          <span className={styles.bar} />
                          <span className={styles.bar} />
                          <span className={styles.bar} />
                        </div>
                      </div>
                    ) : (
                      <span className={styles.idleMicText}>TAP TO START SPEAKING</span>
                    )}
                  </div>
                </div>

                {/* Live Speech Transcript */}
                {transcript && (
                  <div className={styles.transcriptCard}>
                    <div className={styles.transcriptHeader}>
                      <span>YOU SAID:</span>
                      {isListening && <span className={styles.liveIndicator}>LISTENING</span>}
                    </div>
                    <p className={styles.transcriptContent}>"{transcript}"</p>
                  </div>
                )}

                {voiceError && <div className="alert alert-error">{voiceError}</div>}
                {extractError && <div className="alert alert-error">{extractError}</div>}
              </section>

              {/* C. Text Input Alternative */}
              <section className={styles.textAltCard} aria-label="Manual text entry">
                <button
                  type="button"
                  className={styles.textAltToggle}
                  onClick={() => setShowTextInput((prev) => !prev)}
                  aria-expanded={showTextInput}
                >
                  <div className={styles.textAltToggleLeft}>
                    <Edit3 size={17} />
                    <span>Prefer to write? <strong>Type your details instead</strong></span>
                  </div>
                  <span className={styles.toggleCaret}>{showTextInput ? '▲' : '▼'}</span>
                </button>

                {showTextInput && (
                  <div className={styles.textAltForm}>
                    <textarea
                      ref={textareaRef}
                      className={styles.textAreaInput}
                      rows={3}
                      placeholder="Example: I am a 22-year-old student from Uttar Pradesh looking for college scholarships..."
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleManualSubmit();
                        }
                      }}
                      aria-label="Type your information"
                    />
                    <div className={styles.textAltActions}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleManualSubmit}
                        disabled={!manualText.trim()}
                        id="manual-submit-btn"
                      >
                        <ChevronRight size={18} /> Extract My Profile
                      </button>
                      {manualText && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setManualText('')}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* D. Trust and Privacy Note */}
              <div className={styles.trustBanner}>
                <Shield size={20} className={styles.trustIcon} />
                <p className={styles.trustText}>
                  Your information helps us understand your circumstances and identify relevant schemes. Always review eligibility and confirm current requirements through official government sources.
                </p>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════
                RIGHT COLUMN: Helpful Guidance (40-45%)
                ═════════════════════════════════════════════════════ */}
            <aside className={styles.rightCol} aria-label="Guidance and examples">
              
              {/* Section A: What should I tell you? */}
              <div className={styles.guideCard}>
                <h3 className={styles.guideTitle}>HELP US UNDERSTAND YOUR NEEDS</h3>
                <p className={styles.guideSubtitle}>
                  Share what you're comfortable sharing. Include relevant details to help us identify potentially suitable schemes:
                </p>
                <div className={styles.detailsList}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailBadge}>01</span>
                    <span className={styles.detailLabel}>Age</span>
                    <span className={styles.detailDesc}>Matches youth, student, or senior citizen benefits</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailBadge}>02</span>
                    <span className={styles.detailLabel}>State</span>
                    <span className={styles.detailDesc}>Unlocks state-specific grants & welfare schemes</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailBadge}>03</span>
                    <span className={styles.detailLabel}>Occupation</span>
                    <span className={styles.detailDesc}>Farmer, student, artisan, worker, entrepreneur</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailBadge}>04</span>
                    <span className={styles.detailLabel}>Income</span>
                    <span className={styles.detailDesc}>Determines income-based subsidy eligibility</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailBadge}>05</span>
                    <span className={styles.detailLabel}>Category</span>
                    <span className={styles.detailDesc}>General, OBC, SC, ST, or EWS provisions</span>
                  </div>
                </div>
              </div>

              {/* Section B: Try saying something like this */}
              <div className={styles.examplesCard}>
                <div className={styles.examplesHeader}>
                  <Sparkles size={18} />
                  <h3 className={styles.examplesTitle}>TRY SAYING SOMETHING LIKE THIS</h3>
                </div>
                <p className={styles.examplesSub}>
                  Click any example to paste it into the text box:
                </p>
                <div className={styles.exampleChips}>
                  {EXAMPLE_PROMPTS.map((promptText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={styles.exampleChip}
                      onClick={() => handleUseExample(promptText)}
                      title="Click to copy to text input"
                    >
                      <span className={styles.quoteMark}>“</span>
                      <span>{promptText}</span>
                    </button>
                  ))}
                </div>
                <p className={styles.exampleDisclaimer}>
                  *Illustrative examples to help guide your input.
                </p>
              </div>

              {/* Section C: How it works */}
              <div className={styles.howItWorksCard}>
                <h3 className={styles.howItWorksTitle}>HOW IT WORKS</h3>
                <div className={styles.stepsTimeline}>
                  <div className={styles.stepItem}>
                    <div className={styles.stepNumber}>1</div>
                    <div className={styles.stepBody}>
                      <span className={styles.stepTitle}>Tell us about yourself</span>
                      <p className={styles.stepDesc}>Speak in your natural language or type a short description.</p>
                    </div>
                  </div>
                  <div className={styles.stepConnector} />
                  <div className={styles.stepItem}>
                    <div className={styles.stepNumber}>2</div>
                    <div className={styles.stepBody}>
                      <span className={styles.stepTitle}>Review extracted profile</span>
                      <p className={styles.stepDesc}>Our AI reads your parameters. Confirm or edit any detail.</p>
                    </div>
                  </div>
                  <div className={styles.stepConnector} />
                  <div className={styles.stepItem}>
                    <div className={styles.stepNumber}>3</div>
                    <div className={styles.stepBody}>
                      <span className={styles.stepTitle}>Explore matching schemes</span>
                      <p className={styles.stepDesc}>Get a curated list of government schemes you qualify for.</p>
                    </div>
                  </div>
                </div>
              </div>

            </aside>
          </div>
        )}

        {/* ── STAGE 2: PROCESSING (AI Extraction in progress) ── */}
        {stage === STAGE.PROCESSING && (
          <div className={styles.processingCard}>
            <div className={styles.processingSpinner} />
            <h2 className={styles.processingTitle}>Understanding your profile…</h2>
            <p className={styles.processingSub}>
              Our AI is extracting your age, occupation, state, and circumstances to find matching government schemes. This takes just a moment.
            </p>
          </div>
        )}

        {/* ── STAGE 3: CONFIRM (Review Extracted Profile) ── */}
        {stage === STAGE.CONFIRM && profile && (
          <div className={styles.confirmWrapper}>
            <div className={styles.confirmCard}>
              <div className={styles.confirmHeader}>
                <div className={styles.confirmIconWrapper}>
                  <CheckCircle size={24} />
                </div>
                <div className={styles.confirmHeaderText}>
                  <h1 className={styles.confirmTitle}>REVIEW YOUR PROFILE</h1>
                  <p className={styles.confirmSub}>
                    Verify the information extracted by AI. Make corrections if needed before discovering schemes.
                  </p>
                </div>
              </div>

              <div className={styles.confirmBody}>
                <div className={styles.profileGrid}>
                  <ProfileField label="Age"           field="age"           value={profile.age}            type="number"  onChange={handleProfileChange} editMode={editMode} />
                  <ProfileField label="State"          field="state"         value={profile.state}           type="select"  options={STATES}     onChange={handleProfileChange} editMode={editMode} />
                  <ProfileField label="Occupation"     field="occupation"    value={profile.occupation}      type="select"  options={OCCUPATIONS} onChange={handleProfileChange} editMode={editMode} />
                  <ProfileField label="Annual Income"  field="annualIncome"  value={profile.annualIncome}    type="number"  prefix="₹" onChange={handleProfileChange} editMode={editMode} />
                  <ProfileField label="Gender"         field="gender"        value={profile.gender}          type="text"    onChange={handleProfileChange} editMode={editMode} />
                  <ProfileField label="Category"       field="category"      value={profile.category}        type="select"  options={CATEGORIES} onChange={handleProfileChange} editMode={editMode} />
                </div>

                {extractError && <div className="alert alert-error">{extractError}</div>}

                <div className={styles.confirmActions}>
                  <div className={styles.confirmActionsLeft}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setEditMode(!editMode)}
                      id="edit-profile-btn"
                    >
                      <Edit3 size={17} /> {editMode ? 'Done Editing' : 'Edit Information'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setStage(STAGE.IDLE); resetTranscript(); }}
                    >
                      <ArrowLeft size={16} /> Speak or type again
                    </button>
                  </div>

                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleFindSchemes}
                    disabled={stage === STAGE.SUBMITTING}
                    id="find-schemes-btn"
                  >
                    {stage === STAGE.SUBMITTING ? (
                      <><span className="spinner" style={{ width: 18, height: 18 }} /> Finding schemes…</>
                    ) : (
                      <><ChevronRight size={20} /> FIND MY SCHEMES</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STAGE 4: SUBMITTING (Finding Schemes) ── */}
        {stage === STAGE.SUBMITTING && (
          <div className={styles.processingCard}>
            <div className={styles.processingSpinner} />
            <h2 className={styles.processingTitle}>Finding your eligible schemes…</h2>
            <p className={styles.processingSub}>
              Checking criteria across central and state welfare programs to find the best matches for your profile.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}

/** Profile field — editable or read-only */
function ProfileField({ label, field, value, type, options, prefix, onChange, editMode }) {
  return (
    <div className={styles.profileField}>
      <span className={styles.profileLabel}>{label}</span>
      {editMode ? (
        type === 'select' ? (
          <select 
            className="input" 
            value={value || ''} 
            onChange={(e) => onChange(field, e.target.value)} 
            aria-label={label}
          >
            <option value="">— Not specified —</option>
            {options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input 
            className="input" 
            type={type} 
            value={value ?? ''} 
            onChange={(e) => onChange(field, type === 'number' ? Number(e.target.value) : e.target.value)} 
            aria-label={label} 
          />
        )
      ) : (
        <span className={styles.profileValue}>
          {value == null || value === '' ? (
            <span className={styles.notSpecified}>Not specified</span>
          ) : prefix ? (
            `${prefix}${Number(value).toLocaleString('en-IN')}`
          ) : (
            String(value)
          )}
        </span>
      )}
    </div>
  );
}
