// Appointment/ImageReview:

declare type SearchPatient = {
    given: string;
    family: string;
    birthdate: string;
    quantity?: number;
    page?: number;
}

declare type AuthenticationResponse = {
    scope: string;
    token_type: string;
    access_token: string;
    refresh_token: string;
}

declare type SearchPatientResult = {
    found?: boolean;
    name?: string;
    lastname?: string;
    dob?: string;
    modmedId?: string;
}

declare type SearchAppointment = {
    patientId: string;
}

declare type SearchDocuments = {
    date: string;
    description?: string;
    identifier?: string;
    page: string;
    patientId: string;
    type?: string;
}
// ModMed Appointment Response:
declare type SearchSet = {
    total: number;
    entry: ModmedObject[];
}

// ModMed Condition Response:
declare type ConditionSearchSet = {
    total: number;
    entry: ConditionEntry[];
}
// ModMed Condition Entry:
declare type ConditionEntry = {
    resource: Condition
}

// ModMed Medication Response:
declare type MedicationSearchSet = {
    total: number;
    entry: MedicationEntry[];
}

// ModMed Medication Entry:
declare type MedicationEntry = {
    resource: MedicationRequest;
}

declare type MedicationRequest = {
    id: string;
    status: string;
    intent: string;
    medicationCodeableConcept?: MedicationCode;
    subject: Reference;
    authoredOn: string;
    dosageInstruction?: DosageInstruction[];
    dispenseRequest?: DispenseRequest;
    note?: Note[];
}

declare type MedicationCode = {
    coding: Coding[];
    text: string;
}

declare type Reference = {
    reference: string;
    display?: string;
}

declare type DosageInstruction = {
    text?: string;
    timing?: Timing;
    route?: CodeableConcept;
    doseAndRate?: DoseAndRate[];
}

declare type Timing = {
    code?: CodeableConcept;
    repeat?: TimingRepeat;
}

declare type TimingRepeat = {
    frequency?: number;
    period?: number;
    periodUnit?: string;
}

declare type CodeableConcept = {
    coding?: Coding[];
    text?: string;
}

declare type DoseAndRate = {
    doseQuantity?: Quantity;
}

declare type Quantity = {
    value: number;
    unit: string;
    system?: string;
    code?: string;
}

declare type DispenseRequest = {
    quantity?: Quantity;
    expectedSupplyDuration?: Quantity;
}

declare type Note = {
    text: string;
}

declare type Condition = {
    id: string;
    clinicalStatus: ClinicalStatus;
    category: ConditionCategory;
    code: ConditionCode;
    recordedDate: string;
    onsetDateTime: string;
}

declare type ClinicalStatus = {
    coding: Coding
}

declare type ConditionCategory = {
    coding: Coding
}

declare type ConditionCode = {
    coding: Coding
}
// ModMed Appointment Entry:
declare type ModmedObject = {
    fullUrl: string;
    resource: AppointmentResource;
}

declare type AppointmentResource = {
    id: string;
    status: string;
    appointmentType: CodingContainer;
    reasonCode: CodingContainer[];
    supportingInformation: IdentifierContainer[];
    start: string;
    end: string;
    participant: ActorContainer[];
}

declare type Actor = {
    reference: string;
    display: string;
}

declare type CodingContainer = {
    coding: CodingObject[];
    text: string;
}

declare type CodingObject = {
    system: string;
    code: string;
    display: string;
}

declare type IdentifierContainer = {
    identifier: IdentifierObject;
    text: string;
}

declare type IdentifierObject = {
    system: string;
    value: string;
}

declare type ActorContainer = {
    actor: Actor;
}
declare type AppointmentEntry = {
    resource: Appointment
    fullUrl: string
}

declare type Appointment = {
    id: string;
    status: string;
    appointmentType: AppointmentType;
    description: string;
    start: string;
    end: string;
    minutesDuration: number;
    participant: Participant[];
}

declare type AppointmentType = {
    coding: Coding;
    text: string;
}

declare type AppointmentReason = {
    coding: Coding;
    text: string;
}

declare type Coding = {
    system: string;
    code: string;
    display: string;
}

declare type Participant = {
    actor: Actor;
}

declare type ClinicLocation = {
    id: string;
    name: string;
    address: Address;
}

declare type Address = {
    id: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    line: string[];
}

declare type Practitioner = {
    id: string;
    name: Name;
    telecom: Telecom[];
    postalCode: string;
    country: string;
    line: string[];
}

declare type Name = {
    family: string;
    given: string[];
}

declare type Telecom = {
    system: string;
    value: string;
}

declare type AppointmentInfo = {
    appointment: Appointment;
    practitioner: Practitioner;
    location: ClinicLocation
}
