// Used in Doctor.ts
declare type SurgeryPdfs = {
    title: string;
    order: number;
    url: string;
};

declare type AppointmentMobileFE = {
    id: string;
    greeting: string;
    message: string;
    date: AppointmentDate;
    appointmentStatus: ApptImgReviewStatus;
};

declare type AppointmentListItemWebFE = {
    title: string;
    list: AppointmentCardDataWebFE[];
};

declare type SurgeryTasks = {
    title: string;
    message: string;
    isChecked: boolean;
    list: SurgeryTasksItem[];
};

declare type SurgeryTasksItem = {
    message: string;
    order: number;
    title: string;
};

declare type AppointmentCardDataWebFE = {
    id: string;
    patientName: string;
    patientDOB: string;
    formsCompleted: boolean;
    formsStatus: string;
    checkedIn: boolean;
    date: string;
    diagnosis: boolean;
    plan: boolean;
};

declare type AppointmentDetailWebFE = {
    patient: AppointmentDetailPatientWebFE;
    date: number;
    time: AppointmentDetailTimeWebFE;
    locations: string[];
    forms: AppointmentDetailFormsWebFE[];
    files: AppointmentDetailFormsWebFE[];
    archived: boolean;
    completed: boolean;
    diagnoses: AppointmentDetailDiagnosis[];
    diagnosis: AppointmentDetailDiagnosis[];
    planPDFName: string;
};

declare type AppointmentDetailTimeWebFE = {
    hour: string;
    minute: string;
    meridiem: string;
};

declare type AppointmentDetailPatientWebFE = {
    name: string;
    number: string;
    dateOfBirth: string;
    email: string;
};

declare type AppointmentDetailFormsWebFE = {
    name: string;
    isComplete: boolean;
};

declare type AppointmentDetailDiagnosis = {
    id: number;
    title: string;
};

declare type AppointmentUpdateBody = {
    date: number;
    forms: AppointmentDetailFormsWebFE[];
    files: AppointmentDetailFormsWebFE[];
    archived: boolean;
    completed: boolean;
    diagnosis: number[];
    planPDFName: string | null;
    planPDFData: any;
    planIsActive: boolean;
    surgeryDate: number | null;
    tbd: boolean | null;
    currentStatus: string | null;
    joint: string | null;
    laterality: string | null;
    location: string | null;
    final: boolean;
    type: string | null;

};

declare type PlanUpdateObj = {
    id: string;
    date: number;
    title: string;
    isActive: boolean;
    mainDiagnosis: boolean;
    mainDiagnosisPDFName: string;
    diagnosis: any[];
};

declare type PlanCreateObj = {
    id: string;
    date: number;
    title: string;
    isActive: boolean;
    diagnosis: number[];
    mainDiagnosis: boolean;
    mainDiagnosisPDFName: string;
};

declare type ImageReviewMobileFE = {
    id: string;
    greeting: string;
    header: string;
    type: string;
    footer: string;
    reviewStatus: ApptImgReviewStatus;
};

declare type ImageReviewListItemWebFE = {
    id: string;
    patientName: string;
    patientDOB: string;
    status: string;
    statusColor: string;
    date: string;
};

declare type ImageReviewDetailWebFE = {
    patient: AppointmentDetailPatientWebFE;
    types: ImageReviewTypeMenuItem[];
    selectedType: string;
    forms: AppointmentDetailFormsWebFE[];
    files: AppointmentDetailFormsWebFE[];
};

declare type ImageReviewTypeMenuItem = {
    id: string;
    displayName: string;
};

declare type ImageReviewUpdateBody = {
    type: string;
    forms: AppointmentDetailFormsWebFE[];
    files: AppointmentDetailFormsWebFE[];
    completed: boolean;
    appointmentDate: number;
};


declare type ConciergeNextApptItem = {
    nextApptDate: string;
    nextApptTime: string;
    nextApptLocation: string;
}

declare type SurgeryForms = {
    preSurgicalForm: PreSurgicalForm[];
    preSurgicalSignForm: PreSurgicalSignForm[]
}

declare type PreSurgicalForm = {
    id: string;
    name: string;
}

declare type PreSurgicalSignForm = {
    id: string;
    name: string;
}

declare type SurgeryUpdateBody = {
    date: number;
    forms: AppointmentDetailFormsWebFE[];
    files: AppointmentDetailFormsWebFE[];
    archived: boolean;
    completed: boolean;
    tbd: boolean | null;
    joint: string | null;
    laterality: string | null;
};

declare type TemplateRole = {
    roleName: string;
    name: string;
    email: string;
};

declare type EnvelopeDefinition = {
    emailSubject: string;
    templateId: string;
    templateRoles: TemplateRole[];
    status: string;
};

// Inquiries:
declare type InquiryPostBody = {
    doctorId: string,
    inquiryType: string,
    inquirySubtype: string,
    info: string
};

declare type InquiryPostBodyWeb = {
    email: string,
    inquiryType: string,
    inquirySubtype: string,
    info: string
};

// Tickets:

declare type TicketDetailMobileFE = {
    id: string,
    ticketType: number,
    data: any
};

declare type TicketListItemMobileFE = {
    id: string,
    ticketType: number,
    imageUrl: string,
    iconName: string;
    header1: string;
    header2: string;
    message: string;
    hasCallToAction: boolean;
    callToActionMessage: string;
    callToActionLabel: string;
    callToActionValue: number;
    data: any;
    date: number;
};

declare type TicketListItemData = {
    date: AppointmentDate;
    status: ApptImgReviewStatus;
};

declare type TicketTaskReadBody = {
    ticketId: string;
};

// Plans/Diagnoses: 

declare type PlanData = {
    title: string;
    diagnosisPDF: string;
    diagnosisList: Diagnosis[];
};

declare type Diagnosis = {
    title: string;
    resources: DiagnosisResource[];
    bodyArea: string;
};

// Personal Resources:
declare type PersonalResource = {
    type: string;
    title: string;
    url: string;
};

// Misc:
declare type HomeData = {
    firstname: string;
    lastname: string;
    email: string;
    dateOfBirth: string;
    phoneNumber: PhoneNumber;
    files: string[];
    welcomeMessage: WelcomeMessage;
};

declare type ShippingInstructions = {
    title: string;
    message: string;
    footer: string;
    list: ShippingInstruction[];
};

declare type ShippingInstruction = {
    title: string;
    message1: string;
    message2: string;
    message3: string;
    message4: string;
};

declare type TriggerResetTokenBody = {
    email: string;
    dateOfBirth: string;
    deviceId: string;
    deviceToken: string;
};

declare type VerifyResetTokenBody = {
    email: string;
    dateOfBirth: string;
    smsToken: string;
    deviceId: string;
    deviceToken: string;
};

declare type ResetPassBody = {
    email: string;
    dateOfBirth: string;
    password: string;
    deviceId: string;
    deviceToken: string;
};

// Files:
declare type FileUploadBody = {
    type: string,
    front: any,
    back: any
};

// Doctors:
declare type DoctorStaff = {
    doctorId: string;
    firstname: string;
    middlename: string;
    lastname: string;
    title: string;
    staffPosition: string;
    imageUrl: string;
    about: string;
    staff: DoctorStaff[];
}

// ModMed Appointment:
declare type ModmedAppointmentPostBody = {
    doctorId: string,
    date: string,
    id: string
};

declare type ModmedAppointmentResponse = {
    total: number;
    entry: ModmedAppointmentContainer[];
}

// ModMed Appointment Entry:
declare type ModmedAppointmentContainer = {
    fullUrl: string;
    resource: ModmedAppointment
}

declare type ModmedAppointment = {
    id: string;
    resourceType: string;
    status: string;
    appointmentType: ModmedAppointmentType;
    description: string;
    start: string;
    end: string;
    minutesDuration: number;
    participant: ModmedActorContainer[];
}

declare type ModmedAppointmentType = {
    coding: ModmedCoding;
    text: string;
}

declare type ModmedAppointmentReason = {
    coding: ModmedCoding;
    text: string;
}

declare type ModmedCoding = {
    system: string;
    code: string;
    display: string;
}

declare type ModmedActor = {
    reference: string;
    display: string;
}

declare type ModmedActorContainer = {
    actor: ModmedActor;
}