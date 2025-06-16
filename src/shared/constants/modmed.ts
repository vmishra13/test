// ModMed API Configuration Constants
export const modmedAuthenticationBaseUrl = process.env.MODMED_AUTH_BASE_URL || '';
export const modmedAuthenticationData = process.env.MODMED_AUTH_DATA || '';
export const modmedFhirBaseUrl = process.env.MODMED_FHIR_BASE_URL || '';
export const modmedFirmPrefix = process.env.MODMED_FIRM_PREFIX || '';
export const modmedId = process.env.MODMED_ID || '';
export const modmedPassword = process.env.MODMED_PASSWORD || '';
export const modmedKey = process.env.MODMED_KEY || '';

// Computed URLs with firm prefix
export const modmedFullAuthURL = modmedAuthenticationBaseUrl.replace('{firm_url_prefix}', modmedFirmPrefix);
export const modmedFullFhirURL = modmedFhirBaseUrl.replace('{firm_url_prefix}', modmedFirmPrefix);

// ModMed Appointment Types
export enum MODMED_APPOINTMENT_TYPE {
  FOLLOW_UP = '5060',
  MRI = '6127',
  IMAGE_REVIEW = '6124'
}

// ModMed API Response Status Codes
export const MODMED_ERRORS = {
  AUTHENTICATION_FAILED: 'ModMed authentication failed',
  PATIENT_NOT_FOUND: 'Patient not found in ModMed',
  APPOINTMENT_NOT_FOUND: 'Appointment not found in ModMed',
  API_ERROR: 'ModMed API error',
  INVALID_CREDENTIALS: 'Invalid ModMed credentials'
} as const;
