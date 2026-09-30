/**
 * Vocabulary and rules schema for the recommendation engine
 */

export const VOCABULARY = {
  age: { type: 'number' },
  gender: { type: 'enum', values: ['Male', 'Female', 'Transgender', 'Prefer not to say'] },
  state: { 
    type: 'enum', 
    values: [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
      'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
      'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
    ] 
  },
  area: { type: 'enum', values: ['rural', 'urban'] },
  category: { type: 'enum', values: ['General', 'OBC', 'SC', 'ST', 'EWS'] },
  annualIncome: { type: 'number' },
  occupation: { 
    type: 'enum', 
    values: [
      'Farmer', 'Agricultural Labourer', 'Daily Wage Worker', 'Self-Employed',
      'Private Employee', 'Government Employee', 'Business Owner', 'Student',
      'Homemaker', 'Unemployed', 'Retired', 'Artisan / Craftsperson',
      'Fisherman', 'Tribal Community Member', 'Other'
    ] 
  },
  landOwnership: { type: 'boolean' },
  isBPL: { type: 'boolean' },
  housingType: { type: 'enum', values: ['homeless', 'kutcha', 'semi_pucca', 'pucca'] },
  isIncomeTaxPayer: { type: 'boolean' },
  education: { type: 'string' },
  employmentStatus: { type: 'enum', values: ['Employed', 'Self-Employed', 'Unemployed', 'Student', 'Retired'] },
  disability: { type: 'boolean' },
  maritalStatus: { type: 'enum', values: ['Single', 'Married', 'Widowed', 'Divorced', 'Separated'] },
  officialCheck: { type: 'string' }
};

export const ALLOWED_OPERATORS = ['eq', 'gte', 'lte', 'between', 'in', 'exclude'];

export const SYNONYM_MAP = {
  'kisan': 'Farmer',
  'kheti': 'Farmer',
  'farmer': 'Farmer',
  'karigar': 'Artisan / Craftsperson',
  'mistri': 'Artisan / Craftsperson',
  'badhai': 'Artisan / Craftsperson',
  'artisan': 'Artisan / Craftsperson',
  'craftsperson': 'Artisan / Craftsperson',
  'homemaker': 'Homemaker',
  'housewife': 'Homemaker',
  'student': 'Student',
  'student/pupil': 'Student',
  'unemployed': 'Unemployed',
  'berozgar': 'Unemployed',
  'rural': 'rural',
  'gaon': 'rural',
  'village': 'rural',
  'urban': 'urban',
  'shehar': 'urban',
  'city': 'urban',
  'male': 'Male',
  'female': 'Female',
  'admi': 'Male',
  'aurat': 'Female'
};

export function normalizeValue(field, value) {
  if (value === null || value === undefined || value === '') return null;
  
  const def = VOCABULARY[field];
  if (!def) return value; // unknown field

  if (def.type === 'boolean') {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const v = value.toLowerCase();
      if (v === 'true' || v === 'yes' || v === '1') return true;
      if (v === 'false' || v === 'no' || v === '0') return false;
    }
    return null;
  }
  
  if (def.type === 'number') {
    const n = Number(value);
    return isNaN(n) ? null : n;
  }
  
  if (def.type === 'enum') {
    let strVal = String(value).trim();
    const lStrVal = strVal.toLowerCase();
    
    // Check synonym map
    if (SYNONYM_MAP[lStrVal]) {
      strVal = SYNONYM_MAP[lStrVal];
    }
    
    // Match exact (case-insensitive search against defined values)
    const exact = def.values.find(v => v.toLowerCase() === strVal.toLowerCase());
    return exact || null;
  }
  
  return String(value);
}
