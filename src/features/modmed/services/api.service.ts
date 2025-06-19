import axios from 'axios';
import { modmedFullFhirURL } from '../models/constants';
import { ModMedAuthService } from './auth.service';
import { 
  SearchPatient, 
  SearchAppointment, 
  SearchDocuments,
  SearchSet,
  ConditionSearchSet,
  AuthenticationResponse 
} from '../dto/modmed.types';

enum AppointmentStatus {
  PENDING = 'pending',
  BOOKED = 'booked',
  CHECKED_IN = 'checked-in'
}

export class ModMedApiService {
  private authService: ModMedAuthService;

  constructor() {
    this.authService = ModMedAuthService.getInstance();
  }

  /**
   * Find patient by search criteria
   */
  public async findPatient(patient: SearchPatient): Promise<SearchSet | null> {
    try {
      console.log("STARTING: findPatient", patient);

      const params = {
        "family": patient.family,
        "given": patient.given,
        "birthdate": patient.birthdate,
        "_count": patient.quantity?.toString() || "20",
        "_getpagesoffset": ((patient.page || 1) - 1).toString()
      };

      const fullUrl = this.getModMedURL("Patient", params);
      console.log("FULL URL: findPatient", fullUrl);

      const headers = await this.authService.getAuthHeaders();
      const response = await axios.get<SearchSet>(fullUrl, { headers });

      console.log("DATA: findPatient", response.data);
      return response.data || null;
    } catch (error: any) {
      console.error('Error findPatient:', error);
      throw new Error(`Failed to find patient: ${error.message}`);
    }
  }

  /**
   * Get patient by ID
   */
  public async getPatientById(patientId: string): Promise<any> {
    try {
      const fullUrl = this.getModMedURL(`Patient/${patientId}`, {});
      const headers = await this.authService.getAuthHeaders();
      const response = await axios.get(fullUrl, { headers });
      return response.data || null;
    } catch (error: any) {
      console.error('Error getting patient by ID:', error);
      throw new Error(`Failed to get patient by ID: ${error.message}`);
    }
  }

  /**
   * Find patient appointments
   */
  public async findPatientAppointments(filters: SearchAppointment): Promise<SearchSet | null> {
    try {
      console.log("STARTING: findPatientAppointments", filters);

      const params = {
        patient: filters.patientId,
        status: `${AppointmentStatus.PENDING},${AppointmentStatus.CHECKED_IN},${AppointmentStatus.BOOKED}`
      };

      const fullUrl = this.getModMedURL("Appointment", params);
      console.log("FULL URL: findPatientAppointments", fullUrl);

      const headers = await this.authService.getAuthHeaders();
      const response = await axios.get<SearchSet>(fullUrl, { headers });

      console.log("DATA: findPatientAppointments", response.data);
      return response.data || null;
    } catch (error: any) {
      console.error('Error findPatientAppointments:', error);
      throw new Error(`Failed to find patient appointments: ${error.message}`);
    }
  }

  /**
   * Find actor (practitioner/location) by ID
   */
  public async findActor(actorId: string): Promise<any> {
    try {
      console.log("STARTING: findActor", actorId);

      const fullUrl = this.getModMedURL(actorId, {});
      console.log("FULL URL: findActor", fullUrl);

      const headers = await this.authService.getAuthHeaders();
      const response = await axios.get(fullUrl, { headers });

      console.log("DATA: findActor", response.data);
      return response.data || null;
    } catch (error: any) {
      console.error('Error finding Actor:', error);
      throw new Error(`Failed to find actor: ${error.message}`);
    }
  }

  /**
   * Get documents for a patient
   */
  public async getDocuments(patientId: string, category: string): Promise<any> {
    try {
      console.log("STARTING: getDocuments", { patientId, category });

      const params = {
        "patient": patientId,
        "category": category
      };

      const fullUrl = this.getModMedURL("DocumentReference", params);
      console.log("FULL URL: getDocuments", fullUrl);

      const headers = await this.authService.getAuthHeaders();
      const response = await axios.get(fullUrl, { headers });

      console.log("DATA: getDocuments", response.data);
      return response.data || null;
    } catch (error: any) {
      console.error("Error getDocuments:", error);
      throw new Error(`Failed to get documents: ${error.message}`);
    }
  }

  /**
   * Read documents by various criteria
   */
  public async readDocuments(id?: string, patientId?: string, patientRef?: string): Promise<any> {
    try {
      console.log("STARTING: readDocuments", { id, patientId, patientRef });

      let params: Record<string, string> = {};
      let path = "DocumentReference";

      if (id) {
        path = `DocumentReference/${id}`;
      } else if (patientId) {
        params.patient = patientId;
      } else if (patientRef) {
        params.patient = patientRef;
      }

      const fullUrl = this.getModMedURL(path, params);
      console.log("FULL URL: readDocuments", fullUrl);

      const headers = await this.authService.getAuthHeaders();
      const response = await axios.get(fullUrl, { headers });

      console.log("DATA: readDocuments", response.data);
      return response.data || null;
    } catch (error: any) {
      console.error("Error readDocuments:", error);
      throw new Error(`Failed to read documents: ${error.message}`);
    }
  }

  /**
   * Get conditions for a patient
   */
  public async getConditions(patientId: string): Promise<ConditionSearchSet | null> {
    try {
      const params = { patient: patientId };
      const fullUrl = this.getModMedURL('Condition', params);
      const headers = await this.authService.getAuthHeaders();
      const response = await axios.get<ConditionSearchSet>(fullUrl, { headers });
      return response.data || null;
    } catch (error: any) {
      console.error('Error getting conditions:', error);
      throw new Error(`Failed to get conditions: ${error.message}`);
    }
  }

  /**
   * Get document object URL
   */
  public async getDocumentObject(documentId: string): Promise<string | null> {
    try {
      const parsedDocumentId = documentId.replace("|", "%7C");
      const fullUrl = this.getModMedURL(`DocumentReference/${parsedDocumentId}`, {});
      console.log("FULL URL: getDocumentObject", fullUrl);

      const headers = await this.authService.getAuthHeaders();
      const response = await axios.get(fullUrl, { headers });

      const documentUrl = response.data?.content?.attachment?.url;
      console.log("URL of the document:", documentUrl);

      return documentUrl || null;
    } catch (error: any) {
      console.error("Error getDocumentObject:", error);
      throw new Error(`Failed to get document object: ${error.message}`);
    }
  }

  /**
   * Construct ModMed API URL with parameters
   */
  private getModMedURL(path: string, params: Record<string, string>): string {
    let urlParameters = path;
    let queryParams = "";

    for (const [key, value] of Object.entries(params)) {
      if (value) {
        queryParams = queryParams.concat(`${key}=${encodeURIComponent(value)}&`);
      }
    }

    queryParams = queryParams.substring(0, queryParams.length - 1);

    if (queryParams.length > 0) {
      urlParameters = urlParameters.concat(`?${queryParams}`);
    }

    return `${modmedFullFhirURL}${urlParameters}`;
  }
}

// Legacy exports for backward compatibility
export const findPatient = async (patient: SearchPatient) => {
  const apiService = new ModMedApiService();
  return apiService.findPatient(patient);
};

export const findPatientAppointments = async (filters: SearchAppointment) => {
  const apiService = new ModMedApiService();
  return apiService.findPatientAppointments(filters);
};

export const findActor = async (actorId: string) => {
  const apiService = new ModMedApiService();
  return apiService.findActor(actorId);
};

export const getDocuments = async (id: string, category: string) => {
  const apiService = new ModMedApiService();
  return apiService.getDocuments(id, category);
};

export const readDocuments = async (id?: string, patientId?: string, patientRef?: string) => {
  const apiService = new ModMedApiService();
  return apiService.readDocuments(id, patientId, patientRef);
};

export const getConditions = async (patientId: string) => {
  const apiService = new ModMedApiService();
  return apiService.getConditions(patientId);
};

export const getDocumentObject = async (documentId: string) => {
  const apiService = new ModMedApiService();
  return apiService.getDocumentObject(documentId);
};
