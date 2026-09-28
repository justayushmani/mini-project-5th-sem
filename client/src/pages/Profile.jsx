import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      setSuccess('Profile updated successfully.');
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
          <p className="mt-4 muted">Loading your profile…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container container-md">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <UserRound size={28} />
          <h1 style={{ margin: 0 }}>YOUR PROFILE</h1>
        </div>

        <p className="muted" style={{ marginBottom: 24 }}>
          Update the information used to match you with relevant government schemes.
        </p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="alert">{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
            <Field label="Age" htmlFor="age">
              <input id="age" type="number" min="0" max="120" className="input" value={form.age} onChange={(e) => handleChange('age', e.target.value)} />
            </Field>

            <Field label="Gender" htmlFor="gender">
              <select id="gender" className="input" value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label="State" htmlFor="state">
              <select id="state" className="input" value={form.state} onChange={(e) => handleChange('state', e.target.value)}>
                <option value="">Select state</option>
                {STATES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label="Occupation" htmlFor="occupation">
              <select id="occupation" className="input" value={form.occupation} onChange={(e) => handleChange('occupation', e.target.value)}>
                <option value="">Select occupation</option>
                {OCCUPATIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label="Annual Income" htmlFor="annualIncome">
              <input id="annualIncome" type="number" min="0" className="input" value={form.annualIncome} onChange={(e) => handleChange('annualIncome', e.target.value)} />
            </Field>

            <Field label="Category" htmlFor="category">
              <select id="category" className="input" value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
                <option value="">Select category</option>
                {CATEGORIES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label="Education" htmlFor="education">
              <select id="education" className="input" value={form.education} onChange={(e) => handleChange('education', e.target.value)}>
                <option value="">Select education</option>
                {EDUCATION_LEVELS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label="Employment Status" htmlFor="employmentStatus">
              <select id="employmentStatus" className="input" value={form.employmentStatus} onChange={(e) => handleChange('employmentStatus', e.target.value)}>
                <option value="">Select status</option>
                {EMPLOYMENT_STATUS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label="Marital Status" htmlFor="maritalStatus">
              <select id="maritalStatus" className="input" value={form.maritalStatus} onChange={(e) => handleChange('maritalStatus', e.target.value)}>
                <option value="">Select status</option>
                {MARITAL_STATUS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="card" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700 }}>
              <input type="checkbox" checked={form.landOwnership} onChange={(e) => handleChange('landOwnership', e.target.checked)} />
              Owns land
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700 }}>
              <input type="checkbox" checked={form.disability} onChange={(e) => handleChange('disability', e.target.checked)} />
              Has disability
            </label>
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/voice')}>
              Back to Voice
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Saving…</> : <><Save size={18} /> Save Profile</>}
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
