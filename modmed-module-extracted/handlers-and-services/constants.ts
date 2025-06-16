import * as errors from './errors';
import * as missingFieldErrors from './errors';
import { MISSING_EMAIL, MISSING_PASSWORD, UNAUTHORIZED, MISSING_DOB, MISSING_SMS_TOKEN, MISSING_DEVICE_ID,  MISSING_DEVICE_TOKEN } from './errors';

export enum APPT_RESOURCE_TYPE {
    VISIT_SUMMARY_VIDEO = 'VISIT_SUMMARY_VIDEO'
}

export enum LATERALITY {
    LEFT = 'Left',
    RIGHT = 'Right',
    BILATERAL = 'Bilateral',
    NA = 'N/A'
}

export enum JOURNEY_TYPES {
    NON_OP = 'nonop',
    POST_OP = 'postop',
    PRE_OP = 'preop'
};

export enum PLATFORM {
    WEB = 'web',
    MOBILE = 'mobile',
    DOCTORS = 'mobile',
}

export const DEFAULT_TIMEZONE = 'America/Denver';

export const STATIC_IMAGE_REVIEW_FILES_DATA: AppointmentDetailFormsWebFE[] = [
    {
        name: 'Payment Received',
        isComplete: false
    }
];

export enum TICKET_TYPES {
    INQUIRY = 0,
    APPOINTMENT = 1,
    IMAGE_REVIEW = 2,
    SCHEDULED_SURGERIES = 3,
    NON_OPERATIVE = 4,
    MODMED_APPOINTMENT = 5
};

export enum IMAGE_REVIEW_STATUS {
    PENDING = 'Pending',
    IN_PROGRESS = 'In Progress'
};


export enum SURGERY_STATUS {
    INCOMPLETE = 'Incomplete',
    COMPLETED = 'Completed'
};

export enum INQUIRY_STATUS {
    PENDING = 'Pending',
    FAILED_TO_CONTACT = 'Failed to Contact',
    IMAGE_REVIEW = 'Image Review',
    ON_SITE_APPOINTMENT = 'On-site Appointment',
    CLOSE = 'Closed',
    NON_URGENT_SURGERY= 'Non-Urgent Surgery',
    NON_OPERATIVE = 'Non-Operative'
};

export enum APPOINTMENT_STATUS {
    INCOMPLETE = 'Incomplete',
    COMPLETED = 'Completed',
    NOT_REQUIRED = 'Not Required'
};

export enum STAFF_STATUS {
    ACTIVE = 'ACTIVE',
    NOT_ACTIVE = 'NOT_ACTIVE',
    INVITED = 'INVITED'
};

export enum IMAGE_REVIEW_TYPE {
    MRI = 'MRI Image Review',
    XRAY = 'X-Ray Image Review'
};

export enum INQUIRY_TYPES {
    X_RAY_MRI = 'e72f4c244-6a82-4d7f-b219-cb4e60abe907',
    APPOINTMENT = 'ced0a36e-22fc-47de-8333-1e7553b80c17',
    QUESTION = '13f35bb7-8031-4f28-bd55-d2462db55643'
};

export enum DOCTOR_STATUS {
    ACTIVE = 'ACTIVE',
    NOT_ACTIVE = 'NOT_ACTIVE'
};

export const NEW_TICKET_VALIDATION_ATTRS = [
    {
        fieldName: 'doctorId',
        error: errors.MISSING_DOCTOR_ID
    },
    {
        fieldName: 'inquiryType',
        error: errors.MISSING_INQUIRY_TYPE
    },
    {
        fieldName: 'inquirySubtype',
        error: errors.MISSING_INQUIRY_TYPE
    },
    {
        fieldName: 'info',
        error: errors.MISSING_INQUIRY_INFO
    }
];

export const NEW_APPOINTMENT_TICKET_VALIDATION_ATTRS = [
    {
        fieldName: 'email',
        error: errors.MISSING_EMAIL
    },
    {
        fieldName: 'inquiryType',
        error: errors.MISSING_INQUIRY_TYPE
    },
    {
        fieldName: 'inquirySubtype',
        error: errors.MISSING_INQUIRY_TYPE
    },
    {
        fieldName: 'info',
        error: errors.MISSING_INQUIRY_INFO
    }
];

export enum PATIENT_STATUS {
    ACTIVE = 'ACTIVE',
    NOT_ACTIVE = 'NOT_ACTIVE'
};

export const SIGN_UP_ATTRS = [
    {
        fieldName: 'email',
        error: missingFieldErrors.MISSING_EMAIL
    },
    {
        fieldName: 'password',
        error: missingFieldErrors.MISSING_PASSWORD
    },
    {
        fieldName: 'firstname',
        error: missingFieldErrors.MISSING_FIRSTNAME
    },
    {
        fieldName: 'lastname',
        error: missingFieldErrors.MISSING_LASTNAME
    },
    {
        fieldName: 'deviceId',
        error: missingFieldErrors.MISSING_DEVICE_ID
    },
    {
        fieldName: 'dateOfBirth',
        error: missingFieldErrors.MISSING_DOB
    }
];

export const HTTP = {
    POST: 'POST',
    PUT: 'PUT',
    GET: 'GET',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
};

export const STATIC_APPT_FILES_DATA: TicketFormList = {
    title: 'Pre Appointment Files',
    list: [
        {
            id: '0',
            name: 'Personal Photo',
            message: 'Of your face, no hats or sunglasses',
            isComplete: false,
            iconName: 'CrossRed',
            templateId: '0',
            envelopeId: '0',
            formType: 'On-site Appointment'
        },
        {
            id: '1',
            name: 'Insurance Card Photo',
            message: 'Front and back photos',
            isComplete: false,
            iconName: 'CrossRed',
            templateId: '0',
            envelopeId: '0',
            formType: 'On-site Appointment'
        },
        {
            id: '2',
            name: 'Photo ID',
            message: 'Front and back photos',
            isComplete: false,
            iconName: 'CrossRed',
            templateId: '0',
            envelopeId: '0',
            formType: 'On-site Appointment'
        }
    ]
};

export const STATIC_SURGERY_FILES_DATA: TicketFormList = {
    title: 'Pre Surgery Files',
    list: [
        {
            id: '1',
            message: null,
            name: "Preparing Your Skin for Surgery",
            isComplete: false,
            iconName: 'CrossRed',
            templateId: '0',
            envelopeId: '0',
            formType: 'Non-Urgent Surgery'
        },
        {
            id: '2',
            message: null,
            name: "Directions to VVSC-Edwards",
            isComplete: false,
            iconName: 'CrossRed',
            templateId: '0',
            envelopeId: '0',
            formType: 'Non-Urgent Surgery'
        },
        {
            id: '3',
            message: null,
            name: "VH One Medical Passport",
            isComplete: false,
            iconName: 'CrossRed',
            templateId: '0',
            envelopeId: '0',
            formType: 'Non-Urgent Surgery'
        },
        {
            id: '4',
            message: null,
            name: "Vail Health Pre-Surgical Instruction Packet",
            isComplete: false,
            iconName: 'CrossRed',
            templateId: '0',
            envelopeId: '0',
            formType: 'Non-Urgent Surgery'
        },
        {
            id: '5',
            message: null,
            name: "Pre-op Med List",
            isComplete: false,
            iconName: 'CrossRed',
            templateId: '0',
            envelopeId: '0',
            formType: 'Non-Urgent Surgery'
        },
        {
            id: '6',
            message: null,
            name: "Gameready brochure",
            isComplete: false,
            iconName: 'CrossRed',
            templateId: '0',
            envelopeId: '0',
            formType: 'Non-Urgent Surgery'
        },
    ]
};

export const STATIC_SURGERY_TASKS_DATA: SurgeryTasks = {
    isChecked: false,
    list: [
        {
            message: "All patients must be discharged to a responsible party following any procedure – be sure you have arranged a ride home by a responsible adult. Failing to set up this responsible party will result in rescheduling/cancelling of your surgical procedure.",
            order: 6,
            title: "Discharge from the facility"
        },
        {
            message: "Per Anesthesia and regulatory guidelines, there is to be no food consumption within 6 hours of check-in to the surgical facility. You may only have clear liquids (water, apple juice etc.) up until 4 hours before your surgery. Nothing is allowed by mouth within the 4 hours leading up to your procedure.",
            order: 5,
            title: "Food and Beverage Restrictions the day of Surgery"
        },
        {
            message: "You will be notified by our team if a pre-operative medical clearance is required for your surgical procedure. Pre-ops are customarily completed with your Primary Care Physician. They must be completed within 30 days of your surgical procedure. RESULTS MUST BE FAXED TO OUR OFFICE AT: 970-672-0861. If these results are not received by our team within 2 business days prior to your surgery, we will reschedule your procedure.",
            order: 4,
            title: "*If applicable: Complete your pre-operative medical clearance:*"
        },
        {
            message: "A Game Ready representative will be contacting you regarding their services, which you have the option to elect. If you’d like to proactively reach out to Game Ready, their direct contact # is 970-471-6267. A Game Ready brochure is attached for your convenience.",
            order: 3,
            title: "Rent a GameReady (suggested but not required service):"
        },
        {
            message: "Dr. Provencher strongly suggests you start Physical Therapy as soon as you are medically stable. Therefore, Howard Head Physical Therapy Department will be contacting you to set up your initial appointment(s) to ensure there is no delay in your rehabilitation. If you would like to proactively reach out to Howard Head, their direct # is 970-476-1225. It is not a requirement to use Howard Head, if you seek care elsewhere please inform our team so we may fax your specific PT protocol and script to your facility of choice.",
            order: 2,
            title: "Make a plan for Physical Therapy: Where will you be going?"
        },
        {
            message: "Per Vail Valley Surgery Center- Edwards you are required to fill out the “Edwards Medical Passport” online pre-registration platform. Please review the attached PDF enrollment instructions. If you are unable/unwilling to register electronically, please call the Pre-Operative Planning Nurses station at VVSC-V to review your medications, past medical history, etc. Their direct # 970-569-7400. Completing this pre-registration paperwork will assist in a smooth check-in the day of your surgical procedure.",
            order: 1,
            title: "Pre-register at Vail Valley Surgery Center- Edwards"
        }
    ],
    message: "Please carefully read through all the tasks below.",
    title: "Checklist of tasks to complete before the day of surgery. "
};

export const STATIC_SURGERY_PDFS_DATA: SurgeryPdfs[] = [
    {
        title: "Directions to WSC Edwards",
        order: 1,
        url: "https://s3-us-west-1.amazonaws.com/prod.steadman.assets/Directions+to+VVSC-Edwards.pdf"
    },
    {
        title: "Game Ready Brochure",
        order: 2,
        url: "https://s3-us-west-1.amazonaws.com/prod.steadman.assets/GameReadyBrochure.pdf"
    },
    {
        title: "Medical Passport Registration Instructions WSD Edwards",
        order: 3,
        url: "https://s3-us-west-1.amazonaws.com/prod.steadman.assets/Medical+Passport+Registration+Insructions+VVSC-Edwards.pdf"
    },
    {
        title: "Pre-op Med List",
        order: 4,
        url: "https://s3-us-west-1.amazonaws.com/prod.steadman.assets/Pre-op+med+list.pdf"
    },
    {
        title: "Preparing your skin for Surgery",
        order: 5,
        url: "https://s3-us-west-1.amazonaws.com/prod.steadman.assets/Preparing+Your+Skin+For+Surgery.pdf"
    },
];

export const UPDATE_APPT_ATTRS = [
    {
        fieldName: 'date',
        error: errors.MISSING_APPOINTMENT_DATE
    },
    {
        fieldName: 'files',
        error: errors.MISSING_APPOINTMENT_FILES
    },
    {
        fieldName: 'archived',
        error: errors.MISSING_APPOINTMENT_ARCHIVED
    },
    {
        fieldName: 'completed',
        error: errors.MISSING_APPOINTMENT_COMPLETED
    }
];

export const UPDATE_SURGERY_ATTRS = [
    {
        fieldName: 'date',
        error: errors.MISSING_SURGERY_DATE
    },
    {
        fieldName: 'archived',
        error: errors.MISSING_SURGERY_ARCHIVED
    },
    {
        fieldName: 'completed',
        error: errors.MISSING_SURGERY_COMPLETED
    }
];
export const UPDATE_IMG_REV_ATTRS = [
    {
        fieldName: 'type',
        error: errors.MISSING_IMAGE_REVIEW_TYPE
    },
    {
        fieldName: 'forms',
        error: errors.MISSING_IMAGE_REVIEW_FORMS
    },
    {
        fieldName: 'files',
        error: errors.MISSING_IMAGE_REVIEW_FILES
    },
    {
        fieldName: 'completed',
        error: errors.MISSING_IMAGE_REVIEW_COMPLETED
    }
];

export const NOTIFICATION_MESSAGES = {
    APPOINTMENT_UPDATED: {
        title: 'Appointment  updated',
        message: 'Your appointment has been updated. Please login to your app to see the changes.'
    },
    APPOINTMENT_UPDATED_NEW_PLAN: {
        title: 'Plan of Care created',
        message: 'Your plan of care has been created. Please login to your app to review your diagnosis and care recommendations from your doctor.'
    },
    APPOINTMENT_UPDATED_WITH_PLAN: {
        title: 'Plan of Care updated',
        message: 'Your plan of care has been updated. Please login to your app to review your diagnosis and care recommendations from your doctor.'
    },
    APPOINTMENT_CREATED: {
        title: 'New Appointment Booked',
        message: 'A new clinic appointment has been booked. Please login to  your account to begin preparing for your visit.'
    },
    IMAGE_REVIEW_CREATED: {
        title: 'Image review initiated',
        message: 'A new image review has been initiated. Please login to your app (consistency) to review the next steps.'
    },
    IMAGE_REVIEW_UPDATED: {
        title: 'Image review updated',
        message: 'Your image review request has been updated. Please login to your app to see the changes.',
    },
    FOLLOW_UP_APPOINTMENT_CREATED: {
        title: 'Appointment follow-up booked',
        message: 'A follow-up appointment has been booked. Please login to the app to view the details of your upcoming visit.'
    },
    IMAGE_REVIEW_CLOSED: {
        title: 'Image review completed',
        message: 'Your image review has been completed.'
    },
    FAILED_TO_CONTACT: {
        title: 'Failed to contact',
        message: 'Our team has reached out to you by phone without success, so we’ve sent you an email. Please feel welcome to email us back or call the office at (970)-479-5806.'
    },
    PERSONAL_RESOURCES_MODIFIED: {
        title: 'Personal Content Updated',
        message: "Your doctor's team updated your personal content. Login to your account and view the Personal tab in the app."
    },
    NON_URGENT_SURGERY_CREATED: {
        title: 'Surgery booked',
        message: 'Your surgical procedure with Dr. [DOCTOR_NAME] has been booked. Please login to your app to prepare for your upcoming procedure.'
    },
    NON_URGENT_SURGERY_UPDATED: {
        title: 'Surgery updated',
        message: 'Your surgery has been updated. Please login to your app to see the changes.'
    },
    NON_URGENT_SURGERY_CLOSED: {
        title: 'Surgery  closed',
        message: 'Your surgery has been closed. If you have any further inquiries, please create a new inquiry in the app.'
    },
    PATIENT_CARE_JOURNEY_CREATED: {
        title: 'Patient care non-operative journey created',
        message: 'Your non-operative patient care journey has been created. Please login to your app to review it under the “My Plan” menu.'
    },
    PATIENT_CARE_JOURNEY_SURGERY_CREATED: {
        title: 'Patient care surgical journey created ',
        message: 'Your surgical journey with Dr. [DOCTOR_NAME] has been created. Please login to your app to review it under the “My Plan” menu.'
    },
    PATIENT_CARE_JOURNEY_SURGERY_UPDATED: {
        title: 'Patient care surgical journey updated',
        message: 'Your surgical journey with Dr. [DOCTOR_NAME] has been updated. Please login  to your app to review it under the “My Plan” menu.'
    },
    PATIENT_CARE_JOURNEY_FINISHED: {
        title: 'Injury journey completed!',
        message: 'Congratulations on completing your journey'
    },
    // TRIGGER: 7 days before surgery date
    PATIENT_SETUP_PHYSICAL_THERAPY: {
        title: 'Setup physical therapy visits',
        message: 'Have you set up your postoperative physical therapy visits yet?'
    },
    // GEOFENCE
    PATIENT_ARRIVE_CLINIC: {
        title: 'Welcome to The Steadman Clinic and Steadman Philippon Research Institute',
        message: 'Welcome to The Steadman Clinic. Once you finish the registration process, a member of the Provencher Team will meet you in the lobby shortly.'
    },
    PATIENT_LEAVE_CLINIC: {
        title: 'Thank you for your visit!',
        message: 'Thank you for visiting The Steadman Clinic. Please check for updates to the "My Plan" section of the Proven Medical App.'
    }
};

export const DIAGNOSIS_RESOURCE_ATTRS = [
    {
        fieldName: 'title',
        error: errors.MISSING_DIAGNOSIS_RESOURCE_TITLE
    },
    {
        fieldName: 'url',
        error: errors.MISSING_DIAGNOSIS_RESOURCE_URL
    },
    {
        fieldName: 'resourceType',
        error: errors.MISSING_DIAGNOSIS_RESOURCE_TYPE
    }
];

export const PERSONAL_RESOURCE_ATTRS = [
    {
        fieldName: 'type',
        error: errors.MISSING_PERSONAL_RESOURCE_TYPE
    },
    {
        fieldName: 'title',
        error: errors.MISSING_PERSONAL_RESOURCE_TITLE
    },
    {
        fieldName: 'url',
        error: errors.MISSING_PERSONAL_RESOURCE_URL
    }
];

export const SIGN_IN_ATTRS = [
    {
        fieldName: 'email',
        error: MISSING_EMAIL
    },
    {
        fieldName: 'password',
        error: MISSING_PASSWORD
    }
];

export const SIGN_IN_TOKEN_ATTRS = [
    {
        fieldName: 'email',
        error: missingFieldErrors.MISSING_EMAIL
    },
    {
        fieldName: 'password',
        error: missingFieldErrors.MISSING_PASSWORD
    },
    {
        fieldName: 'smsToken',
        error: missingFieldErrors.MISSING_SMS_TOKEN
    },
    {
        fieldName: 'deviceId',
        error: missingFieldErrors.MISSING_DEVICE_ID
    }
];

export const docusignIntegratorKey = process.env.DOCUSIGN_INTEGRATOR_KEY;
export const docusignBaseURL = process.env.DOCUSIGN_BASE_URL;
export const docusignBaseOAuthURL = process.env.DOCUSIGN_BASE_OAUTH_URL;
export const docusignWebhookBaseURL = process.env.DOCUSIGN_WEBHOOK_BASE_URL;
export const docusignUserId = process.env.DOCUSIGN_USER_ID;
export const docusignRSAName = process.env.DOCUSIGN_RSA_NAME;

export enum MODMED_APPOINTMENT_TYPE {
    FOLLOW_UP = '5060',
    MRI = '6127',
    IMAGE_REVIEW = '6124'
};

export const FILE_UPLOAD_VALIDATION_ATTRS = [
    { 
        fieldName: 'type',
        error: errors.MISSING_FILE_TYPE
    },
    {
        fieldName: 'front',
        error: errors.MISSING_FILE_FRONT
    }
];

export const modmedAuthenticationBaseUrl = process.env.MODMED_AUTH_BASE_URL || "";
export const modmedAuthenticationData = process.env.MODMED_AUTH_DATA || ""; 
export const modmedFhirBaseUrl = process.env.MODMED_FHIR_BASE_URL || "";
export const modmedFirmPrefix = process.env.MODMED_FIRM_PREFIX || "";
export const modmedId = process.env.MODMED_ID || "";
export const modmedPassword = process.env.MODMED_PASSWORD || "";
export const modmedKey = process.env.MODMED_KEY || "";
export const modmedFullAuthURL = modmedAuthenticationBaseUrl.replace('{firm_url_prefix}', modmedFirmPrefix);
export const modmedFullFhirURL = modmedFhirBaseUrl.replace('{firm_url_prefix}', modmedFirmPrefix);

export const CHANGE_PASSWORD_ATTRS = [
    {
        fieldName: 'email',
        error: missingFieldErrors.MISSING_EMAIL
    },
    {
        fieldName: 'password',
        error: missingFieldErrors.MISSING_PASSWORD
    }
]

export const UPSERT_CONDITION_EXCEPTION = {
	statusCode: 400,
	code: "ConditionalCheckFailedException"
}

export const DEVICE_FAILED_TRIGGER_VERIFICATION = { 
    code: 302, 
    message: 'Sms token trigger failed; needs to retry signin'
};

export const DEVICE_NOT_VALID = {
    code: 401,
    message: 'The device is not valid'
};

export const DEVICE_TOKEN_VERIFICATION_FAILED = {
    code: 401,
    message: UNAUTHORIZED
};

export const NO_PATIENT_FOUND_ERROR = { 
    code: 404, 
    message: 'No patient found matching those credentials.'
};

export const TRIGGER_RESET_PASS_TOKEN_ATTRS = [
    {
        fieldName: 'email',
        error: MISSING_EMAIL
    },
    {
        fieldName: 'dateOfBirth',
        error: MISSING_DOB
    },
    {
        fieldName: 'deviceId',
        error: MISSING_DEVICE_ID
    }, 
    {
        fieldName: 'deviceToken',
        error: MISSING_DEVICE_TOKEN    
    }
];

export const VERIFY_RESET_PASS_TOKEN_ATTRS = [
    {
        fieldName: 'email',
        error: MISSING_EMAIL
    },
    {
        fieldName: 'dateOfBirth',
        error: MISSING_DOB
    },
    {
        fieldName: 'smsToken',
        error: MISSING_SMS_TOKEN
    },
    {
        fieldName: 'deviceId',
        error: MISSING_DEVICE_ID
    }, 
    {
        fieldName: 'deviceToken',
        error: MISSING_DEVICE_TOKEN    
    }
];

export const TRIGGER_PHONE_TOKEN_ATTRS = [
    {
        fieldName: 'email',
        error: missingFieldErrors.MISSING_EMAIL
    },
    {
        fieldName: 'countryCode',
        error: missingFieldErrors.MISSING_COUNTRY_CODE
    },
    {
        fieldName: 'phoneNumber',
        error: missingFieldErrors.MISSING_PHONE_NUMBER
    },
    {
        fieldName: 'deviceId',
        error: missingFieldErrors.MISSING_DEVICE_ID
    }
];

export const VERIFY_PHONE_TOKEN_ATTRS = [
    {
        fieldName: 'email',
        error: missingFieldErrors.MISSING_EMAIL
    },
    {
        fieldName: 'smsToken',
        error: missingFieldErrors.MISSING_SMS_TOKEN
    },
    {
        fieldName: 'countryCode',
        error: missingFieldErrors.MISSING_COUNTRY_CODE
    },
    {
        fieldName: 'phoneNumber',
        error: missingFieldErrors.MISSING_PHONE_NUMBER
    },
    {
        fieldName: 'deviceId',
        error: missingFieldErrors.MISSING_DEVICE_ID
    }
];

export const RESET_PASS_ATTRS = [
    {
        fieldName: 'email',
        error: MISSING_EMAIL
    },
    {
        fieldName: 'dateOfBirth',
        error: MISSING_DOB
    },
    {
        fieldName: 'password',
        error: MISSING_PASSWORD
    },
    {
        fieldName: 'deviceId',
        error: MISSING_DEVICE_ID
    }, 
    {
        fieldName: 'deviceToken',
        error: MISSING_DEVICE_TOKEN    
    }
];

export const MULTIPLE_DOCTOR_FOUND_ERROR = { 
    code: 404, 
    message: 'MUltiple doctors found matching that id.'
};

export const DEVICE_NOT_VERIFIED_ERROR = { 
    code: 301, 
    message: 'Needs to send sms token to authentiate'
};

export const NOT_ACTIVE_USER_OR_WRONG_CREDENTIALS_ERROR = { 
    code: 404, 
    message: 'User is not Active or Wrong Credentials .'
};

export const PASSWORD_RESET_CONFLICT = {
    code: 301,
    message: 'Password can not be the same as previous password(s)'
};

export const DEV_CHECK_RESP_CODE = {
    SUCCESS: {
        code: 200,
        message: 'Bit State Not Found',
        messageAlt: 'Failed to find bit state',
        error: {
            code: 400,
            message: '',
        }
    },
    TOO_MANY_REQUESTS: {
        code: 429,
        message: 'Too Many Requests',
        error: {
            code: 429,
            message: 'Apple Device Check Service is busy, please try again later'
        }
    },
    SERVER_ERROR: {
        code: 500,
        message: 'Server Error',
        error: {
            code: 500,
            message: 'Apple Device Check Service is currently experiencing issues, please try again later'
        }
    },
    SERVICE_UNAVAILABLE: {
        code: 503,
        message: 'Service Unavailable',
        error: {
            code: 503,
            message: 'Apple Device Check Service is currently unavailable, please try again later'
        }
    },
    GET_STATUS_FAILURE: {
        code: 403,
        message: 'Apple Device Check failed',
        error: {
            code: 403,
            message: 'Apple Device Check failed'
        }
    },
    UPDATE_STATUS_FAILURE:{
        code: 500,
        message: '',
        error: {
            code: 500,
            message: 'Failed to update Apple Device Check Bit State for device'
        }
    },
    BAD_REQUEST: {
        code: 400,
        message: '',
        error: {
            code: 400,
            message: 'Server error with request to Apple DeviceCheck API'
        }
    }
};

export const DEV_CHECK_REQ_PARAMS_ERROR = {
    AUTH_FILE_MISSING: {
        code: 400, 
        message: 'Apple DeviceCheck Authkey file missing or improperly formatted'
    },
    KEY_ID_MISSING: {
        code: 400, 
        message: 'Apple DeviceCheck Key ID missing'
    },
    TEAM_ID_MISSING: {
        code: 400, 
        message: 'Apple DeviceCheck Team ID missing'
    }
};

export const NO_USER_FOUND_ERROR = { 
    code: 404, 
    message: 'No user found matching those credentials.'
};

export const COMPONENT_TYPE_ID = {
    article: 1,
    video: 2,
    weblink: 3,
    direction: 4,
    date: 5,
    time: 6,
    pre_op_restriction: 7,
    post_op_restriction: 8,
    pt_script: 9,
    forms: 10,
    task: 11,
    location: 12,
    restriction: 13,
    image: 14,
    medication: 15,
    summary_video: 16
};