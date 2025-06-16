# ModMed Module Dependencies Analysis

## Core Dependencies
The ModMed module requires the following npm packages:

- axios (for HTTP requests to ModMed API)
- moment (for date handling in appointments)
- uuid (for generating unique IDs)

## Import Analysis
Files that import external dependencies:

/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/core/modmed/authentication.ts:import axios from 'axios';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/core/modmed/index.ts:import { readDocuments } from "./services"
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/core/modmed/services.ts:import axios from 'axios';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/populate/core/modmed/authentication.ts:import axios from 'axios';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/populate/core/modmed/index.ts:import { readDocuments } from "./services"
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/populate/core/modmed/services.ts:import axios from 'axios';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/Doctor.ts:import { v4 as uuidV4 } from 'uuid'
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/authentication.ts:import axios from 'axios';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/createInquiry.ts:import moment from 'moment';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/createInquiry.ts:import { v4 as uuidV4 } from "uuid";
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/SignUpBodyIOS.ts:import moment from 'moment';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/SignUpBodyIOS.ts:import { Patient } from '.';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/patientInfo.ts:import { v4 as uuidV4 } from 'uuid';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/patientInfo.ts:import moment from 'moment';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/Ticket.ts:import * as dynamoose from 'dynamoose';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/Ticket.ts:import { Document } from "dynamoose/dist/Document";
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/services.ts:import axios from 'axios';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/modmed.ts:import moment from 'moment';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/handlers-and-services/modmed.ts:import { v4 as uuidV4 } from "uuid";
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/doctors/core/modmed/authentication.ts:import axios from 'axios';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/doctors/core/modmed/index.ts:import { readDocuments } from "./services"
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/doctors/core/modmed/services.ts:import axios from 'axios';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/api/core/modmed/authentication.ts:import axios from 'axios';
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/api/core/modmed/index.ts:import { readDocuments } from "./services"
/Users/sarfraz/hifinite/development/hybrid/reliacare/reliacare-backend//modmed-module-extracted/api/core/modmed/services.ts:import axios from 'axios';
