import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, CheckCircle, UserRound } from 'lucide-react';
import profileService from '../services/profile.service.js';
import { getErrorMessage } from '../utils/formatters.js';
import {
  STATES,
  OCCUPATIONS,
  CATEGORIES,
  EDUCATION_LEVELS,
  EMPLOYMENT_STATUS,
  GENDER_OPTIONS,
  MARITAL_STATUS,
} from '../utils/constants.js';

const emptyForm = {
  age: '',
  gender: '',
  state: '',
  occupation: '',
  annualIncome: '',
  category: '',
  education: '',
  employmentStatus: '',
  landOwnership: false,
  disability: false,
  maritalStatus: '',
};

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await profileService.get();
        const profile = data?.profile || null;

        setForm(profile ? {
          age: profile.age ?? '',
          gender: profile.gender ?? '',
          state: profile.state ?? '',
          occupation: profile.occupation ?? '',
          annualIncome: profile.annualIncome ?? '',
          category: profile.category ?? '',
          education: profile.education ?? '',
          employmentStatus: profile.employmentStatus ?? '',
          landOwnership: Boolean(profile.landOwnership),
          disability: Boolean(profile.disability),
          maritalStatus: profile.maritalStatus ?? '',
        } : emptyForm);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        age: form.age === '' ? null : Number(form.age),
        annualIncome: form.annualIncome === '' ? null : Number(form.annualIncome),
        landOwnership: form.landOwnership === '' ? null : Boolean(form.landOwnership),
        disability: form.disability === '' ? null : Boolean(form.disability),
      };

      await profileService.update(payload);
      setSuccess(t('profile.profileUpdated'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="container text-center" style={{ paddingTop: 80 }}>
          <div className="spinner" style={{ width: 38, height: 38 }} />
          <p className="mt-4 muted">{t('profile.loadingProfile')}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container container-md">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <UserRound size={28} />
          <h1 style={{ margin: 0 }}>{t('profile.title')}</h1>
        </div>

        <p className="muted" style={{ marginBottom: 24 }}>
          {t('profile.subtitle')}
        </p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="alert">{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
            <Field label={t('profile.labelAge')} htmlFor="age">
              <input id="age" type="number" min="0" max="120" className="input" value={form.age} onChange={(e) => handleChange('age', e.target.value)} />
            </Field>

            <Field label={t('profile.labelGender')} htmlFor="gender">
              <select id="gender" className="input" value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                <option value="">{t('profile.selectGender')}</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label={t('profile.labelState')} htmlFor="state">
              <select id="state" className="input" value={form.state} onChange={(e) => handleChange('state', e.target.value)}>
                <option value="">{t('profile.selectState')}</option>
                {STATES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label={t('profile.labelOccupation')} htmlFor="occupation">
              <select id="occupation" className="input" value={form.occupation} onChange={(e) => handleChange('occupation', e.target.value)}>
                <option value="">{t('profile.selectOccupation')}</option>
                {OCCUPATIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label={t('profile.labelAnnualIncome')} htmlFor="annualIncome">
              <input id="annualIncome" type="number" min="0" className="input" value={form.annualIncome} onChange={(e) => handleChange('annualIncome', e.target.value)} />
            </Field>

            <Field label={t('profile.labelCategory')} htmlFor="category">
              <select id="category" className="input" value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
                <option value="">{t('profile.selectCategory')}</option>
                {CATEGORIES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label={t('profile.labelEducation')} htmlFor="education">
              <select id="education" className="input" value={form.education} onChange={(e) => handleChange('education', e.target.value)}>
                <option value="">{t('profile.selectEducation')}</option>
                {EDUCATION_LEVELS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label={t('profile.labelEmploymentStatus')} htmlFor="employmentStatus">
              <select id="employmentStatus" className="input" value={form.employmentStatus} onChange={(e) => handleChange('employmentStatus', e.target.value)}>
                <option value="">{t('profile.selectStatus')}</option>
                {EMPLOYMENT_STATUS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label={t('profile.labelMaritalStatus')} htmlFor="maritalStatus">
              <select id="maritalStatus" className="input" value={form.maritalStatus} onChange={(e) => handleChange('maritalStatus', e.target.value)}>
                <option value="">{t('profile.selectStatus')}</option>
                {MARITAL_STATUS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="card" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700 }}>
              <input type="checkbox" checked={form.landOwnership} onChange={(e) => handleChange('landOwnership', e.target.checked)} />
              {t('profile.ownsLand')}
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700 }}>
              <input type="checkbox" checked={form.disability} onChange={(e) => handleChange('disability', e.target.checked)} />
              {t('profile.hasDisability')}
            </label>
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/voice')}>
              {t('profile.backToVoice')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 18, height: 18 }} /> {t('profile.saving')}</> : <><Save size={18} /> {t('profile.saveProfile')}</>}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="form-label" style={{ fontSize: '0.72rem' }}>{label}</span>
      {children}
    </label>
  );
}
