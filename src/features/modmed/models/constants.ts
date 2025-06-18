// ModMed Constants

export const MODMED_CONFIG = {
  authenticationBaseUrl: process.env.MODMED_AUTH_BASE_URL || "",
  authenticationData: process.env.MODMED_AUTH_DATA || "",
  fhirBaseUrl: process.env.MODMED_FHIR_BASE_URL || "",
  firmPrefix: process.env.MODMED_FIRM_PREFIX || "",
  id: process.env.MODMED_ID || "",
  password: process.env.MODMED_PASSWORD || "",
  key: process.env.MODMED_KEY || "",
} as const;

// Computed URLs
export const modmedFullAuthURL = MODMED_CONFIG.authenticationBaseUrl.replace(
  '{firm_url_prefix}', 
  MODMED_CONFIG.firmPrefix
);

export const modmedFullFhirURL = MODMED_CONFIG.fhirBaseUrl.replace(
  '{firm_url_prefix}', 
  MODMED_CONFIG.firmPrefix
);

// Legacy exports for backward compatibility
export const modmedAuthenticationBaseUrl = MODMED_CONFIG.authenticationBaseUrl;
export const modmedAuthenticationData = MODMED_CONFIG.authenticationData;
export const modmedFhirBaseUrl = MODMED_CONFIG.fhirBaseUrl;
export const modmedFirmPrefix = MODMED_CONFIG.firmPrefix;
export const modmedId = MODMED_CONFIG.id;
export const modmedPassword = MODMED_CONFIG.password;
export const modmedKey = MODMED_CONFIG.key;

// ModMed specific constants
export const MODMED_APPOINTMENT_TYPE = {
  SCHEDULE: 'Schedule An Appointment',
  FOLLOW_UP: 'Follow Up',
  CONSULTATION: 'Consultation',
} as const;

export const MODMED_TIMEZONE = 'Mountain Time';

export const MODMED_ENDPOINTS = {
  AUTHENTICATION: '/auth/token',
  PATIENTS: '/Patient',
  APPOINTMENTS: '/Appointment',
  PRACTITIONERS: '/Practitioner',
  LOCATIONS: '/Location',
  CONDITIONS: '/Condition',
  DOCUMENTS: '/DocumentReference',
} as const;
