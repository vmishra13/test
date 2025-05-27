export enum Role {
  SUPER_ADMIN = 'super-admin',
  CLIENT_ADMIN = 'client-admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  PATIENT = 'patient',
}

export interface User {
  id: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
