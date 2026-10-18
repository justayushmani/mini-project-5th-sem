import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, AlertTriangle, CheckCircle, Clock, ShieldAlert, ArrowRight, X, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { simplifyDocument } from '../services/docSimplifier.service.js';
import styles from './DocSimplifier.module.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

const STRINGS = {
  en: {
    title: 'Legal & Government Doc Simplifier',
    subtitle: 'Upload a notice, land record, certificate, or legal order to get a clear, citizen-friendly explanation in plain language.',
    dropzoneTitle: 'Drag and drop your document here',
    dropzoneHint: 'Supports PNG, JPEG, and PDF up to 10 MB',
    browse: 'or click to browse from device',
    consentText: "I understand my document will be sent to Google's Gemini AI service to be read and summarized. Yojana Saathi does not save the file, but Google may use content sent through the free Gemini service to improve its products. Please hide (mask) Aadhaar and bank account numbers before uploading.",
    buttonSubmit: 'Simplify Document',
    buttonProcessing: 'Analyzing document with Gemini AI...',
    summaryTitle: 'Plain Language Summary',
    keyPointsTitle: 'Key Points',
    datesTitle: 'Important Dates & Amounts',
    tableHeaderDetail: 'Detail',
    tableHeaderValue: 'Value / Date',
    disclaimerLabel: 'Disclaimer:',
    obligationsTitle: 'Your Obligations (What You Must Do)',
    redFlagsTitle: 'Important Warnings & Deadlines',
    nextStepsTitle: 'Recommended Next Steps',
    unreadableTitle: 'Document Quality Warning',
    unreadableHint: 'The document appears blurry, cut off, or difficult to read. For better accuracy, please upload a clearer photo or higher-resolution scan.',
    mockBanner: 'Sample Result (Demo Mode): Gemini API key is not configured; showing a simulated response.',
    errSize: 'File size exceeds 10 MB. Please choose a smaller file.',
    errType: 'Unsupported file format. Please upload a PNG, JPEG, or PDF file.',
    errGeneric: 'Something went wrong while analyzing the document. Please try again.',
    err400: 'Invalid document or parameters. Please ensure your file is a valid PNG, JPEG, or PDF.',
    err413: 'The file exceeds the 10 MB size limit.',
    err429: 'The AI service is currently busy with high traffic. Please wait a minute and try again.',
    err502: 'The AI model is temporarily unavailable. Please retry shortly.',
    err503: 'Document Simplifier is currently not configured on this server.',
    clear: 'Remove file',
    previewAlt: 'Document preview',
  },
  hi: {
    title: 'सरकारी व कानूनी दस्तावेज़ सहायक',
    subtitle: 'कोई भी सरकारी नोटिस, खसरा/खतौनी, प्रमाण-पत्र या आदेश अपलोड करें और आसान हिन्दी में उसका स्पष्ट अर्थ समझें।',
    dropzoneTitle: 'अपना दस्तावेज़ यहाँ खींचें और छोड़ें',
    dropzoneHint: 'PNG, JPEG और PDF (अधिकतम 10 MB) समर्थित हैं',
    browse: 'या अपने डिवाइस से चुनने के लिए क्लिक करें',
    consentText: 'मैं समझता/समझती हूँ कि मेरे दस्तावेज़ को पढ़ने और सारांश तैयार करने के लिए Google की Gemini AI सेवा में भेजा जाएगा। योजना साथी इस फ़ाइल को सहेजता नहीं है, लेकिन Google अपने उत्पादों को बेहतर बनाने के लिए मुफ़्त Gemini सेवा के माध्यम से भेजी गई सामग्री का उपयोग कर सकता है। कृपया अपलोड करने से पहले दस्तावेज़ में आधार और बैंक खाता संख्या छिपा लें।',
    buttonSubmit: 'दस्तावेज़ को समझें',
    buttonProcessing: 'Gemini AI द्वारा दस्तावेज़ का विश्लेषण जारी है...',
    summaryTitle: 'सरल सारांश',
    keyPointsTitle: 'मुख्य बातें',
    datesTitle: 'महत्वपूर्ण तिथियाँ और राशियाँ',
    tableHeaderDetail: 'विवरण',
    tableHeaderValue: 'मान / तिथि',
    disclaimerLabel: 'अस्वीकरण:',
    obligationsTitle: 'आपकी जिम्मेदारियाँ (आपको क्या करना होगा)',
    redFlagsTitle: 'चेतावनी और समय-सीमाएँ',
    nextStepsTitle: 'अनुशंसित अगले कदम',
    unreadableTitle: 'दस्तावेज़ गुणवत्ता चेतावनी',
    unreadableHint: 'दस्तावेज़ धुंधला, कटा हुआ या पढ़ने में कठिन प्रतीत होता है। बेहतर सटीकता के लिए कृपया स्पष्ट फ़ोटो या उच्च गुणवत्ता वाला स्कैन अपलोड करें।',
    mockBanner: 'नमूना परिणाम (डेमो मोड): Gemini API कुंजी कॉन्फ़िगर नहीं है; एक सिम्युलेटेड उत्तर दिखाया जा रहा है।',
    errSize: 'फ़ाइल का आकार 10 MB से अधिक है। कृपया एक छोटी फ़ाइल चुनें।',
    errType: 'असमर्थित फ़ाइल प्रारूप। कृपया केवल PNG, JPEG या PDF फ़ाइल अपलोड करें।',
    errGeneric: 'दस्तावेज़ का विश्लेषण करते समय कोई समस्या आई। कृपया पुनः प्रयास करें।',
    err400: 'अमान्य दस्तावेज़ या पैरामीटर। कृपया सुनिश्चित करें कि फ़ाइल वैध PNG, JPEG या PDF है।',
    err413: 'फ़ाइल का आकार 10 MB की सीमा से अधिक है।',
    err429: 'AI सेवा वर्तमान में अत्यधिक व्यस्त है। कृपया कुछ देर बाद पुनः प्रयास करें।',
    err502: 'AI सेवा अस्थायी रूप से अनुपलब्ध है। कृपया थोड़ी देर बाद पुनः प्रयास करें।',
    err503: 'दस्तावेज़ सरलकर्ता सेवा इस सर्वर पर वर्तमान में कॉन्फ़िगर नहीं है।',
    clear: 'फ़ाइल हटाएं',
    previewAlt: 'दस्तावेज़ पूर्वावलोकन',
  },
};

export default function DocSimplifier() {
  const { language: currentLang } = useLanguage();
  const isHindi = currentLang === 'hi';
  const t = isHindi ? STRINGS.hi : STRINGS.en;
  const targetApiLang = isHindi ? 'hi' : 'en';

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  // Revoke object URL on cleanup
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateAndSelectFile = (selected) => {
    setError(null);
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type.toLowerCase()) && !selected.name.match(/\.(png|jpe?g|pdf)$/i)) {
      setError(t.errType);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError(t.errSize);
      return;
    }

    setFile(selected);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (selected.type.startsWith('image/')) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !consent || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', targetApiLang);
    formData.append('consent', 'true');

    try {
      const data = await simplifyDocument(formData);
      setResult(data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) {
        setError(t.err400);
      } else if (status === 413) {
        setError(t.err413);
      } else if (status === 429) {
        setError(t.err429);
      } else if (status === 502) {
        setError(t.err502);
      } else if (status === 503) {
        setError(t.err503);
      } else {
        setError(err.response?.data?.message || t.errGeneric);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.subtitle}>{t.subtitle}</p>
        </header>

        <section className={styles.uploadCard}>
          <form onSubmit={handleSubmit}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Dropzone */}
            {!file ? (
              <div
                className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              >
                <div className={styles.dropzoneIcon}>
                  <UploadCloud size={48} />
                </div>
                <div className={styles.dropzoneTitle}>{t.dropzoneTitle}</div>
                <div className={styles.dropzoneHint}>{t.dropzoneHint}</div>
                <div style={{ marginTop: 'var(--space-2)', fontSize: '0.85rem', color: 'var(--black)', fontWeight: 600 }}>
                  {t.browse}
                </div>
              </div>
            ) : (
              <div className={styles.previewBox}>
                {previewUrl ? (
                  <img src={previewUrl} alt={t.previewAlt} className={styles.thumbnail} />
                ) : (
                  <div className={styles.pdfIconBox}>
                    <FileText size={32} />
                  </div>
                )}
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileSize}>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={handleRemoveFile}
                  title={t.clear}
                  aria-label={t.clear}
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Consent Box */}
            <div className={styles.consentBox}>
              <input
                id="docConsent"
                type="checkbox"
                className={styles.checkbox}
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <label htmlFor="docConsent" className={styles.consentLabel}>
                {t.consentText}
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-error" style={{ marginTop: 'var(--space-4)' }}>
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            {/* Submit Action */}
            <div className={styles.actions}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!file || !consent || loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    {t.buttonProcessing}
                  </>
                ) : (
                  <>
                    {t.buttonSubmit} <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Results Section */}
        {result && (
          <section className={styles.resultCard}>
            {result.mock && (
              <div className={styles.mockBanner}>
                <Info size={18} /> {t.mockBanner}
              </div>
            )}

            {(result.unreadable || result.lowConfidence) && (
              <div className={styles.warningBanner}>
                <AlertTriangle size={20} />
                <div>
                  <strong>{t.unreadableTitle}: </strong>
                  {t.unreadableHint}
                </div>
              </div>
            )}

            <header className={styles.resultHeader}>
              <div className={styles.docType}>{result.documentType}</div>
            </header>

            {/* Summary */}
            <div className={styles.summarySection}>
              <h2 className={styles.sectionTitle}>
                <FileText size={18} /> {t.summaryTitle}
              </h2>
              <p className={styles.summaryText}>{result.summary}</p>
            </div>

            {/* Structured Points Grid */}
            <div className={styles.pointsGrid}>
              {/* Key Points */}
              {Array.isArray(result.keyPoints) && result.keyPoints.length > 0 && (
                <div>
                  <h3 className={styles.sectionTitle}>
                    <CheckCircle size={16} /> {t.keyPointsTitle}
                  </h3>
                  <ul className={styles.pointsList}>
                    {result.keyPoints.map((point, i) => (
                      <li key={i} className={styles.pointItem}>
                        <span className={styles.pointBullet}>•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Obligations */}
              {Array.isArray(result.obligations) && result.obligations.length > 0 && (
                <div>
                  <h3 className={styles.sectionTitle}>
                    <Clock size={16} /> {t.obligationsTitle}
                  </h3>
                  <ul className={styles.pointsList}>
                    {result.obligations.map((item, i) => (
                      <li key={i} className={styles.pointItem}>
                        <span className={styles.pointBullet}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Dates & Amounts */}
            {Array.isArray(result.datesAndAmounts) && result.datesAndAmounts.length > 0 && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h3 className={styles.sectionTitle}>
                  <Clock size={16} /> {t.datesTitle}
                </h3>
                <table className={styles.datesTable}>
                  <thead>
                    <tr>
                      <th>{t.tableHeaderDetail}</th>
                      <th>{t.tableHeaderValue}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.datesAndAmounts.map((item, i) => (
                      <tr key={i}>
                        <td>{item.label}</td>
                        <td>{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Red Flags & Next Steps Grid */}
            <div className={styles.pointsGrid}>
              {/* Red Flags */}
              {Array.isArray(result.redFlags) && result.redFlags.length > 0 && (
                <div>
                  <h3 className={styles.sectionTitle} style={{ color: 'var(--coral)' }}>
                    <ShieldAlert size={16} /> {t.redFlagsTitle}
                  </h3>
                  <ul className={styles.pointsList}>
                    {result.redFlags.map((flag, i) => (
                      <li key={i} className={styles.pointItem}>
                        <span className={styles.pointBullet} style={{ color: 'var(--coral)' }}>!</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              {Array.isArray(result.nextSteps) && result.nextSteps.length > 0 && (
                <div>
                  <h3 className={styles.sectionTitle}>
                    <ArrowRight size={16} /> {t.nextStepsTitle}
                  </h3>
                  <ul className={styles.pointsList}>
                    {result.nextSteps.map((step, i) => (
                      <li key={i} className={styles.pointItem}>
                        <span className={styles.pointBullet}>→</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Legal Disclaimer */}
            {result.disclaimer && (
              <div className={styles.disclaimerBox}>
                <strong>{t.disclaimerLabel} </strong>
                {result.disclaimer}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
