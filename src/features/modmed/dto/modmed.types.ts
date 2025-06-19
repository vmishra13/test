// ModMed Type Definitions

export interface SearchPatient {
  given: string;
  family: string;
  birthdate: string;
  quantity?: number;
  page?: number;
}

export interface AuthenticationResponse {
  scope: string;
  token_type: string;
  access_token: string;
  refresh_token: string;
}

export interface SearchPatientResult {
  found?: boolean;
  name?: string;
  lastname?: string;
  dob?: string;
  modmedId?: string;
}

export interface SearchAppointment {
  patientId: string;
}

export interface SearchDocuments {
  date: string;
  description?: string;
  identifier?: string;
  page: string;
  patientId: string;
  type?: string;
}

// ModMed Appointment Response Types
export interface SearchSet {
  total: number;
  entry: ModmedObject[];
}

// ModMed Condition Response Types
export interface ConditionSearchSet {
  total: number;
  entry: ConditionEntry[];
}

export interface ConditionEntry {
  resource: Condition;
}

export interface Condition {
  id: string;
  clinicalStatus: ClinicalStatus;
  category: ConditionCategory;
  code: ConditionCode;
  recordedDate: string;
  onsetDateTime: string;
}

export interface ClinicalStatus {
  coding: Coding;
}

export interface ConditionCategory {
  coding: Coding;
}

export interface ConditionCode {
  coding: Coding;
}

// ModMed Appointment Entry Types
export interface ModmedObject {
  fullUrl: string;
  resource: AppointmentResource;
}

export interface AppointmentResource {
  id: string;
  status: string;
  appointmentType: CodingContainer;
  reasonCode: CodingContainer[];
  supportingInformation: IdentifierContainer[];
  start: string;
  end: string;
  participant: ActorContainer[];
}

export interface Actor {
  reference: string;
  display: string;
}

export interface CodingContainer {
  coding: CodingObject[];
  text: string;
}

export interface CodingObject {
  system: string;
  code: string;
  display: string;
}

export interface IdentifierContainer {
  identifier: IdentifierObject;
  text: string;
}

export interface IdentifierObject {
  system: string;
  value: string;
}

export interface ActorContainer {
  actor: Actor;
}

export interface AppointmentEntry {
  resource: Appointment;
  fullUrl: string;
}

export interface Appointment {
  id: string;
  status: string;
  appointmentType: AppointmentType;
  description: string;
  start: string;
  end: string;
  minutesDuration: number;
  participant: Participant[];
}

export interface AppointmentType {
  coding: Coding;
  text: string;
}

export interface AppointmentReason {
  coding: Coding;
  text: string;
}

export interface Coding {
  system: string;
  code: string;
  display: string;
}

export interface Participant {
  actor: Actor;
}

export interface ClinicLocation {
  id: string;
  name: string;
  address: Address;
}

export interface Address {
  id: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  line: string[];
}

export interface Practitioner {
  id: string;
  name: Name;
  telecom: Telecom[];
  postalCode: string;
  country: string;
  line: string[];
}

export interface Name {
  family: string;
  given: string[];
}

export interface Telecom {
  system: string;
  value: string;
}

export interface AppointmentInfo {
  appointment: Appointment;
  practitioner: Practitioner;
  location: ClinicLocation;
}

// Additional types that may be referenced
export interface AppointmentDate {
  day: string;
  date: string;
  timezone: string;
  time: string;
  unix: number;
}

export interface Patient {
  id: string;
  email: string;
  modmedId?: string;
  // Add other patient fields as needed
}

export interface Doctor {
  id: string;
  modmedId?: string;
  // Add other doctor fields as needed
}
