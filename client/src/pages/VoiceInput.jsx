import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
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
  const { t } = useTranslation();
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

  const examplePrompts = [
    t('voice.example1'),
    t('voice.example2'),
    t('voice.example3'),
  ];

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
              
              {/* 1. Small yellow introductory label, Heading & Description */}
              <div className={styles.headingBlock}>
                <span className={styles.eyebrowBadge}>
                  {t('voice.eyebrow')}
                </span>
                <h1 className={styles.mainTitle}>
                  {t('voice.mainTitle')} <span className={styles.highlightText}>{t('voice.mainTitleHighlight')}</span> {t('voice.mainTitleEnd')}
                </h1>
                <p className={styles.supportingCopy}>
                  {t('voice.supportingCopy')}
                </p>
              </div>

              {/* 2. Prominent Voice Panel */}
              <section className={styles.voiceCard} aria-label="Voice Input Section">
                <div className={styles.voiceCardHeader}>
                  <div>
                    <h2 className={styles.voiceCardTitle}>{t('voice.speakAboutYourself')}</h2>
                    <p className={styles.voiceCardSub}>
                      <Trans i18nKey="voice.speakNaturally">
                        Speak naturally in <strong>Hindi</strong>, <strong>English</strong>, or <strong>Bengali</strong>
                      </Trans>
                    </p>
                  </div>
                  <span className={styles.langPill} title={`Current speech language: ${language}`}>
                    {language.toUpperCase()}
                  </span>
                </div>

                <div className={styles.cardDivider} />

                {!isSupported && (
                  <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                    {t('voice.voiceNotSupported')}
                  </div>
                )}

                {/* Microphone Control Button */}
                <div className={styles.micControlArea}>
                  <div className={styles.micRingWrapper}>
                    <button
                      className={`${styles.micButton} ${isListening ? styles.micButtonListening : ''}`}
                      onClick={handleMicClick}
                      aria-label={isListening ? t('voice.stopRecording') : t('voice.startRecording')}
                      aria-pressed={isListening}
                      disabled={!isSupported}
                      id="mic-button"
                    >
                      {isListening ? <MicOff size={42} /> : <Mic size={42} />}
                      {isListening && <div className={styles.pulseWaveRing} />}
                    </button>
                  </div>

                  {/* Dynamic Status Indicator */}
                  <div className={styles.micStatusLabel}>
                    {isListening ? (
                      <div className={styles.liveListeningRow}>
                        <span className={styles.liveRedDot} />
                        <span className={styles.liveListeningText}>{t('voice.listeningText')}</span>
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
                      <span className={styles.idleMicText}>{t('voice.tapToStart')}</span>
                    )}
                  </div>
                </div>

                {/* Live Speech Transcript */}
                {transcript && (
                  <div className={styles.transcriptCard}>
                    <div className={styles.transcriptHeader}>
                      <span>{t('voice.youSaid')}</span>
                      {isListening && <span className={styles.liveIndicator}>{t('voice.listening')}</span>}
                    </div>
                    <p className={styles.transcriptContent}>"{transcript}"</p>
                  </div>
                )}

                {voiceError && <div className="alert alert-error" style={{ marginTop: 14 }}>{voiceError}</div>}
                {extractError && <div className="alert alert-error" style={{ marginTop: 14 }}>{extractError}</div>}
              </section>

              {/* 3. Text Input Alternative */}
              <section className={styles.textAltCard} aria-label="Manual text entry">
                <button
                  type="button"
                  className={styles.textAltToggle}
                  onClick={() => setShowTextInput((prev) => !prev)}
                  aria-expanded={showTextInput}
                >
                  <div className={styles.textAltToggleLeft}>
                    <Edit3 size={18} />
                    <span>{t('voice.preferToWrite')} <strong>{t('voice.typeDetails')}</strong></span>
                  </div>
                  <span className={styles.toggleCaret}>{showTextInput ? t('voice.collapse') : t('voice.expand')}</span>
                </button>

                {showTextInput && (
                  <div className={styles.textAltForm}>
                    <textarea
                      ref={textareaRef}
                      className={styles.textAreaInput}
                      rows={3}
                      placeholder={t('voice.textPlaceholder')}
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
                        <ChevronRight size={18} /> {t('voice.extractProfile')}
                      </button>
                      {manualText && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setManualText('')}
                        >
                          {t('common.clear')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* 4. Trust and Privacy Note */}
              <div className={styles.trustBanner}>
                <Shield size={20} className={styles.trustIcon} />
                <p className={styles.trustText}>
                  {t('voice.trustText')}
                </p>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════
                RIGHT COLUMN: Helpful Guidance (40-45%)
                ═════════════════════════════════════════════════════ */}
            <aside className={styles.rightCol} aria-label="Guidance and examples">
              
              {/* Panel 1: Help us understand your needs */}
              <section className={styles.guideCard}>
                <h3 className={styles.panelTitle}>{t('voice.helpTitle')}</h3>
                <p className={styles.panelSubtitle}>
                  {t('voice.helpSubtitle')}
                </p>
                <div className={styles.detailsList}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailBadge}>01</span>
                    <span className={styles.detailLabel}>{t('voice.detailAge')}</span>
                    <span className={styles.detailDesc}>{t('voice.detailAgeDesc')}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailBadge}>02</span>
                    <span className={styles.detailLabel}>{t('voice.detailState')}</span>
                    <span className={styles.detailDesc}>{t('voice.detailStateDesc')}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailBadge}>03</span>
                    <span className={styles.detailLabel}>{t('voice.detailOccupation')}</span>
                    <span className={styles.detailDesc}>{t('voice.detailOccupationDesc')}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailBadge}>04</span>
                    <span className={styles.detailLabel}>{t('voice.detailIncome')}</span>
                    <span className={styles.detailDesc}>{t('voice.detailIncomeDesc')}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailBadge}>05</span>
                    <span className={styles.detailLabel}>{t('voice.detailCategory')}</span>
                    <span className={styles.detailDesc}>{t('voice.detailCategoryDesc')}</span>
                  </div>
                </div>
              </section>

              {/* Panel 2: Try saying something like this */}
              <section className={styles.examplesCard}>
                <div className={styles.examplesHeader}>
                  <Sparkles size={18} />
                  <h3 className={styles.panelTitle}>{t('voice.trySaying')}</h3>
                </div>
                <p className={styles.panelSubtitle}>
                  {t('voice.clickExample')}
                </p>
                <div className={styles.exampleChips}>
                  {examplePrompts.map((promptText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={styles.exampleChip}
                      onClick={() => handleUseExample(promptText)}
                      title="Click to copy to text input"
                    >
                      <span className={styles.quoteMark}>“</span>
                      <span className={styles.exampleChipText}>{promptText}</span>
                    </button>
                  ))}
                </div>
                <p className={styles.exampleDisclaimer}>
                  {t('voice.exampleDisclaimer')}
                </p>
              </section>

              {/* Panel 3: How it works */}
              <section className={styles.howItWorksCard}>
                <h3 className={styles.panelTitle}>{t('voice.howItWorks')}</h3>
                <div className={styles.timelineContainer}>
                  <div className={styles.timelineLine} aria-hidden="true" />
                  <div className={styles.timelineStep}>
                    <div className={styles.stepCircle}>1</div>
                    <div className={styles.stepContent}>
                      <strong className={styles.stepTitle}>{t('voice.step1Title')}</strong>
                      <p className={styles.stepDesc}>{t('voice.step1Desc')}</p>
                    </div>
                  </div>
                  <div className={styles.timelineStep}>
                    <div className={styles.stepCircle}>2</div>
                    <div className={styles.stepContent}>
                      <strong className={styles.stepTitle}>{t('voice.step2Title')}</strong>
                      <p className={styles.stepDesc}>{t('voice.step2Desc')}</p>
                    </div>
                  </div>
                  <div className={styles.timelineStep}>
                    <div className={styles.stepCircle}>3</div>
                    <div className={styles.stepContent}>
                      <strong className={styles.stepTitle}>{t('voice.step3Title')}</strong>
                      <p className={styles.stepDesc}>{t('voice.step3Desc')}</p>
                    </div>
                  </div>
                </div>
              </section>

            </aside>
          </div>
        )}

        {/* ── STAGE 2: PROCESSING (AI Extraction in progress) ── */}
        {stage === STAGE.PROCESSING && (
          <div className={styles.processingCard}>
            <div className={styles.processingSpinner} />
            <h2 className={styles.processingTitle}>{t('voice.processingTitle')}</h2>
            <p className={styles.processingSub}>
              {t('voice.processingSub')}
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
                  <h1 className={styles.confirmTitle}>{t('voice.reviewProfile')}</h1>
                  <p className={styles.confirmSub}>
                    {t('voice.reviewSub')}
                  </p>
                </div>
              </div>

              <div className={styles.confirmBody}>
                <div className={styles.profileGrid}>
                  <ProfileField label={t('voice.labelAge')}           field="age"           value={profile.age}            type="number"  onChange={handleProfileChange} editMode={editMode} t={t} />
                  <ProfileField label={t('voice.labelState')}         field="state"         value={profile.state}           type="select"  options={STATES}     onChange={handleProfileChange} editMode={editMode} t={t} />
                  <ProfileField label={t('voice.labelOccupation')}    field="occupation"    value={profile.occupation}      type="select"  options={OCCUPATIONS} onChange={handleProfileChange} editMode={editMode} t={t} />
                  <ProfileField label={t('voice.labelAnnualIncome')} field="annualIncome"  value={profile.annualIncome}    type="number"  prefix="₹" onChange={handleProfileChange} editMode={editMode} t={t} />
                  <ProfileField label={t('voice.labelGender')}        field="gender"        value={profile.gender}          type="text"    onChange={handleProfileChange} editMode={editMode} t={t} />
                  <ProfileField label={t('voice.labelCategory')}      field="category"      value={profile.category}        type="select"  options={CATEGORIES} onChange={handleProfileChange} editMode={editMode} t={t} />
                </div>

                {extractError && <div className="alert alert-error">{extractError}</div>}

                <div className={styles.confirmActions}>
                  <div className={styles.confirmActionsLeft}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setEditMode(!editMode)}
                      id="edit-profile-btn"
                    >
                      <Edit3 size={17} /> {editMode ? t('voice.doneEditing') : t('voice.editInfo')}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setStage(STAGE.IDLE); resetTranscript(); }}
                    >
                      <ArrowLeft size={16} /> {t('voice.speakAgain')}
                    </button>
                  </div>

                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleFindSchemes}
                    disabled={stage === STAGE.SUBMITTING}
                    id="find-schemes-btn"
                  >
                    {stage === STAGE.SUBMITTING ? (
                      <><span className="spinner" style={{ width: 18, height: 18 }} /> {t('voice.findingSchemes')}</>
                    ) : (
                      <><ChevronRight size={20} /> {t('voice.findMySchemes')}</>
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
            <h2 className={styles.processingTitle}>{t('voice.findingSchemesTitle')}</h2>
            <p className={styles.processingSub}>
              {t('voice.findingSchemesSub')}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}

/** Profile field — editable or read-only */
function ProfileField({ label, field, value, type, options, prefix, onChange, editMode, t }) {
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
            <option value="">— {t ? t('common.notSpecified') : 'Not specified'} —</option>
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
            <span className={styles.notSpecified}>{t ? t('common.notSpecified') : 'Not specified'}</span>
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
