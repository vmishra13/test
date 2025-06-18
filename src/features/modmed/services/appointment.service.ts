import { ModMedApiService } from './api.service';
import { 
  SearchAppointment, 
  ModmedObject, 
  ClinicLocation, 
  Practitioner 
} from '../dto/modmed.types';

export class ModMedAppointmentService {
  private apiService: ModMedApiService;

  constructor() {
    this.apiService = new ModMedApiService();
  }

  /**
   * Get patient appointment list with enhanced details (location and practitioner)
   */
  public async getPatientAppointmentList(patientId: string): Promise<ModmedObject[]> {
    try {
      const apptData: SearchAppointment = {
        patientId: patientId
      };

      const response = await this.apiService.findPatientAppointments(apptData);

      if (response && response.total > 0 && response.entry) {
        // Enhance appointments with location and practitioner details
        for (let j = 0; j < response.entry.length; j++) {
          const appointment = response.entry[j];
          
          if (appointment.resource.participant && appointment.resource.participant.length > 0) {
            // Process each participant to get location and practitioner details
            for (let i = 0; i < appointment.resource.participant.length; i++) {
              const participant = appointment.resource.participant[i];
              const reference = participant.actor.reference;
              
              try {
                if (reference.includes('Location')) {
                  const id = reference.substring(reference.lastIndexOf('/') + 1);
                  const location = await this.getLocation(id);
                  
                  if (location) {
                    (appointment.resource as any)["location"] = location;
                  }
                }

                if (reference.includes('Practitioner')) {
                  const id = reference.substring(reference.lastIndexOf('/') + 1);
                  const practitioner = await this.getPractitioner(id);

                  if (practitioner) {
                    (appointment.resource as any)["practitioner"] = practitioner;
                  }
                }
              } catch (error) {
                console.error(`Error enhancing appointment participant ${reference}:`, error);
                // Continue processing other participants even if one fails
              }
            }
          }
        }

        return response.entry;
      }

      return [];
    } catch (error) {
      console.error('Error getting patient appointment list:', error);
      throw new Error(`Failed to get patient appointment list: ${error}`);
    }
  }

  /**
   * Get location details by ID
   */
  public async getLocation(locationId: string): Promise<ClinicLocation | null> {
    try {
      const location = await this.apiService.findActor(`Location/${locationId}`);
      return location || null;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  /**
   * Get practitioner details by ID
   */
  public async getPractitioner(practitionerId: string): Promise<Practitioner | null> {
    try {
      const practitioner = await this.apiService.findActor(`Practitioner/${practitionerId}`);
      return practitioner || null;
    } catch (error) {
      console.error('Error getting practitioner:', error);
      return null;
    }
  }

  /**
   * Get appointment by ID
   */
  public async getAppointmentById(appointmentId: string): Promise<ModmedObject | null> {
    try {
      const appointment = await this.apiService.findActor(`Appointment/${appointmentId}`);
      
      if (appointment) {
        return {
          fullUrl: `Appointment/${appointmentId}`,
          resource: appointment
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting appointment by ID:', error);
      return null;
    }
  }

  /**
   * Get appointments by date range
   */
  public async getAppointmentsByDateRange(
    patientId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ModmedObject[]> {
    try {
      // First get all appointments for the patient
      const appointments = await this.getPatientAppointmentList(patientId);
      
      // Filter by date range
      const filteredAppointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.resource.start);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return appointmentDate >= start && appointmentDate <= end;
      });

      return filteredAppointments;
    } catch (error) {
      console.error('Error getting appointments by date range:', error);
      throw new Error(`Failed to get appointments by date range: ${error}`);
    }
  }
}

// Legacy exports for backward compatibility
export const getPatientAppointmentList = async (patientId: string): Promise<ModmedObject[]> => {
  const appointmentService = new ModMedAppointmentService();
  return appointmentService.getPatientAppointmentList(patientId);
};

export const getLocation = async (locationId: string): Promise<ClinicLocation | null> => {
  const appointmentService = new ModMedAppointmentService();
  return appointmentService.getLocation(locationId);
};

export const getPractitioner = async (practitionerId: string): Promise<Practitioner | null> => {
  const appointmentService = new ModMedAppointmentService();
  return appointmentService.getPractitioner(practitionerId);
};
