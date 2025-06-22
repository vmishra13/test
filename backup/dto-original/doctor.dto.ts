/**
 * Doctor Selection DTOs for ReliaCare Mobile App
 * Focused on doctor discovery and selection workflows
 */

// ===================================================================
// DOCTOR SELECTION
// ===================================================================
export interface DoctorSelectionRequest {
  doctorId: number;
  preferredAppointmentTime?: string;
  notes?: string;
}

export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  specialization: string;
  title: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  profilePictureUrl?: string;
  availableSlots?: string[];
  clientId: number; // Multi-tenant support
  location?: {
    clinic: string;
    address: string;
    city: string;
    state: string;
  };
}

export interface DoctorSelectionResponse {
  success: boolean;
  data: {
    selectedDoctor: Doctor;
    appointmentScheduled?: boolean;
    nextSteps: string[];
  };
}

export interface DoctorsListResponse {
  success: boolean;
  data: {
    doctors: Doctor[];
    total: number;
    filters: {
      specializations: string[];
      locations: string[];
    };
  };
}
