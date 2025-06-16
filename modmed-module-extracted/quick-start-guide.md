# ModMed Module Quick Start Guide

## 1. Copy Files
Copy the extracted files from this directory to your reliacare-backend project:

```bash
# Copy core module
cp -r core/modmed/ /path/to/reliacare-backend/src/core/

# Copy types
cp types/modmed.types.d.ts /path/to/reliacare-backend/src/types/

# Copy handlers (adapt as needed)
cp handlers-and-services/*.ts /path/to/reliacare-backend/src/handlers/
```

## 2. Install Dependencies
```bash
cd /path/to/reliacare-backend
npm install axios moment uuid @types/uuid
```

## 3. Configure Environment
Add these environment variables to your .env file:
```

MODMED_APPOINTMENT_TYPE {
MODMED_AUTH_BASE_URL
MODMED_AUTH_BASE_URL=https://mmapi.ema-api.com/ema-prod/firm/{firm_url_prefix
MODMED_AUTH_DATA
MODMED_AUTH_DATA='grant_type=password&username=fhir_fzCSm&password=EOA7EBh3Ki'
MODMED_FHIR_BASE_URL
MODMED_FHIR_BASE_URL=https://mmapi.ema-api.com/ema-prod/firm/{firm_url_prefix
MODMED_FIRM_PREFIX
MODMED_FIRM_PREFIX=tsc
MODMED_ID
MODMED_ID=fhir_fzCSm
MODMED_KEY
MODMED_KEY=5ccc677f8893d40a34bc26288b646d0a0bac4045b5e73d41c5387631
MODMED_PASSWORD
MODMED_PASSWORD=EOA7EBh3Ki
```

## 4. Basic Usage Example
```typescript
import { getPatientAppointmentList } from './core/modmed/appointments';
import { getPatient } from './core/modmed/patient';

// Search for a patient
const patient = await getPatient('John', 'Doe', '1990-01-01');

// Get patient appointments
if (patient.modmedId) {
    const appointments = await getPatientAppointmentList(patient.modmedId);
}
```

## 5. Next Steps
- Review the integration-checklist.md for complete setup
- Test the authentication with your ModMed credentials
- Adapt the code to match your project's patterns

