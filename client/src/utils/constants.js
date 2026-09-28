// ── App-wide constants ──

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // UTs
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const OCCUPATIONS = [
  'Farmer', 'Agricultural Labourer', 'Daily Wage Worker', 'Self-Employed',
  'Private Employee', 'Government Employee', 'Business Owner', 'Student',
  'Homemaker', 'Unemployed', 'Retired', 'Artisan / Craftsperson',
  'Fisherman', 'Tribal Community Member', 'Other',
];

export const CATEGORIES = [
  'General', 'OBC', 'SC', 'ST', 'EWS',
];

export const EDUCATION_LEVELS = [
  'No Formal Education', 'Primary (Up to Class 5)', 'Middle (Up to Class 8)',
  'Secondary (Class 10)', 'Higher Secondary (Class 12)', 'Diploma',
  'Graduate', 'Post Graduate', 'Doctorate',
];

export const SCHEME_CATEGORIES = [
  'Agriculture', 'Education', 'Health', 'Housing', 'Employment',
  'Social Welfare', 'Women & Child', 'Skill Development', 'Financial Inclusion',
  'Insurance', 'Pension', 'Minority Welfare', 'Tribal Welfare', 'Disability',
];

export const SCHEME_LEVELS = ['Central', 'State', 'District'];

export const EMPLOYMENT_STATUS = [
  'Employed', 'Self-Employed', 'Unemployed', 'Student', 'Retired',
];

export const GENDER_OPTIONS = ['Male', 'Female', 'Transgender', 'Prefer not to say'];

export const MARITAL_STATUS = ['Single', 'Married', 'Widowed', 'Divorced', 'Separated'];

// Language codes for speech recognition
export const SPEECH_LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  hinglish: 'hi-IN', // Hinglish uses Hindi speech recognition
};
