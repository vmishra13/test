# ModMed Module File Structure

## Recommended Structure for reliacare-backend

```
src/
├── core/
│   ├── modmed/
│   │   ├── authentication.ts
│   │   ├── services.ts
│   │   ├── appointments.ts
│   │   ├── patient.ts
│   │   └── index.ts
│   ├── types/
│   │   └── modmed.types.d.ts
│   └── constants.ts (add modmed constants here)
├── handlers/
│   ├── modmedPatientsHandler.ts
│   └── other handlers that use modmed...
└── services/
    └── modmed.ts
```

## Current Files Extracted:

- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/migration-manifest.md
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/environment-variables.env
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/types/populate-modmed.types.d.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/types/api-types.d.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/types/main-types.d.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/types/api-modmed.types.d.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/types/doctors-modmed.types.d.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/types/modmed.types.d.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/core/modmed/authentication.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/core/modmed/appointments.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/core/modmed/patient.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/core/modmed/index.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/core/modmed/services.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/modmed-usage-files.txt
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/dependencies-analysis.md
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/modmed-constants.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/populate/core/modmed/authentication.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/populate/core/modmed/appointments.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/populate/core/modmed/patient.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/populate/core/modmed/index.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/populate/core/modmed/services.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/modmedPatients.test.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/Doctor.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/signUpIOS.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/patientHandler.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/types.d.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/authentication.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/createInquiry.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/SignUpBodyIOS.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/constants.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/patient.types.d.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/Patient.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/signUpIOSHandler.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/patientInfo.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/modmedPatientsHandler.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/modmed.types.d.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/Ticket.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/services.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/modmed.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/doctors/core/modmed/authentication.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/doctors/core/modmed/appointments.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/doctors/core/modmed/patient.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/doctors/core/modmed/index.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/doctors/core/modmed/services.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/api/core/modmed/authentication.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/api/core/modmed/appointments.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/api/core/modmed/patient.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/api/core/modmed/index.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/api/core/modmed/services.ts
- /Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/file-structure.md
