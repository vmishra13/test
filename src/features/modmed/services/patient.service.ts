import { SearchPatient, SearchPatientResult } from '../dto/modmed.types';
import { ModMedApiService } from './api.service';

export class ModMedPatientService {
  private apiService: ModMedApiService;

  constructor() {
    this.apiService = new ModMedApiService();
  }

  /**
   * Get a list of patients with pagination
   */
  public async getPatientsList(quantity: number = 20, page: number = 1): Promise<SearchPatientResult[]> {
    try {
      const searchParams: SearchPatient = {
        given: '',
        family: '',
        birthdate: '',
        quantity: quantity,
        page: page
      };

      const response = await this.apiService.findPatient(searchParams);
      const patients: SearchPatientResult[] = [];

      if (response && response.entry) {
        response.entry.forEach((patientEntry: any) => {
          const patientResource = patientEntry.resource; // ModMed patient resource
          const patientResult: SearchPatientResult = {
            found: true,
            name: patientResource.name?.[0]?.given?.[0] || '',
            lastname: patientResource.name?.[0]?.family || '',
            dob: patientResource.birthDate,
            modmedId: patientResource.id
          };
          patients.push(patientResult);
        });
      }

      return patients;
    } catch (error) {
      console.error('Error getting patients list:', error);
      throw new Error(`Failed to get patients list: ${error}`);
    }
  }

  /**
   * Search for a specific patient by name and date of birth
   */
  public async getPatient(
    patientName: string, 
    patientLastname: string, 
    patientDOB: string
  ): Promise<SearchPatientResult> {
    try {
      const params: SearchPatient = {
        given: patientName,
        family: patientLastname,
        birthdate: patientDOB
      };

      const response = await this.apiService.findPatient(params);

      if (response && response.total === 1 && response.entry?.[0]) {
        const patientResource = response.entry[0].resource as any; // ModMed patient resource
        return {
          found: true,
          name: patientResource.name?.[0]?.given?.[0] || '',
          lastname: patientResource.name?.[0]?.family || '',
          dob: patientResource.birthDate,
          modmedId: patientResource.id
        };
      }

      return { found: false };
    } catch (error) {
      console.error('Error getting patient:', error);
      return { found: false };
    }
  }

  /**
   * Search for a patient by ModMed ID
   */
  public async getPatientById(modmedId: string): Promise<SearchPatientResult> {
    try {
      const response = await this.apiService.getPatientById(modmedId);

      if (response) {
        return {
          found: true,
          name: response.name?.[0]?.given?.[0] || '',
          lastname: response.name?.[0]?.family || '',
          dob: response.birthDate,
          modmedId: response.id
        };
      }

      return { found: false };
    } catch (error) {
      console.error('Error getting patient by ID:', error);
      return { found: false };
    }
  }
}

// Legacy exports for backward compatibility
export const getPatientsList = async (quantity: number, page: number): Promise<SearchPatientResult[]> => {
  const patientService = new ModMedPatientService();
  return patientService.getPatientsList(quantity, page);
};

export const getPatient = async (
  patientName: string, 
  patientLastname: string, 
  patientDOB: string
): Promise<SearchPatientResult> => {
  const patientService = new ModMedPatientService();
  return patientService.getPatient(patientName, patientLastname, patientDOB);
};
