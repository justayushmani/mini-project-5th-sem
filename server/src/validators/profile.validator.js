import { z } from 'zod';

const VALID_CATEGORIES         = ['General', 'OBC', 'SC', 'ST', 'EWS'];
const VALID_EMPLOYMENT_STATUS  = ['Employed', 'Self-Employed', 'Unemployed', 'Student', 'Retired'];
const VALID_MARITAL_STATUS     = ['Single', 'Married', 'Widowed', 'Divorced', 'Separated'];
const VALID_GENDER             = ['Male', 'Female', 'Transgender', 'Prefer not to say'];

export const updateProfileSchema = z.object({
  age:              z.number().int().min(0).max(120).nullable().optional(),
  gender:           z.enum(VALID_GENDER).nullable().optional(),
  state:            z.string().min(2).max(100).nullable().optional(),
  district:         z.string().min(2).max(100).nullable().optional(),
  occupation:       z.string().min(2).max(100).nullable().optional(),
  annualIncome:     z.number().min(0).nullable().optional(),
  category:         z.enum(VALID_CATEGORIES).nullable().optional(),
  education:        z.string().max(100).nullable().optional(),
  employmentStatus: z.enum(VALID_EMPLOYMENT_STATUS).nullable().optional(),
  landOwnership:    z.boolean().nullable().optional(),
  disability:       z.boolean().nullable().optional(),
  maritalStatus:    z.enum(VALID_MARITAL_STATUS).nullable().optional(),
  otherInfo:        z.record(z.unknown()).nullable().optional(),
});
