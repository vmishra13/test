import axios from 'axios';
import { 
  modmedFullAuthURL, 
  modmedId, 
  modmedPassword, 
  modmedKey, 
  modmedAuthenticationData 
} from '../models/constants';
import { AuthenticationResponse } from '../dto/modmed.types';

export class ModMedAuthService {
  private static instance: ModMedAuthService;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private constructor() {}

  public static getInstance(): ModMedAuthService {
    if (!ModMedAuthService.instance) {
      ModMedAuthService.instance = new ModMedAuthService();
    }
    return ModMedAuthService.instance;
  }

  /**
   * Authenticate with ModMed API and get access token
   */
  public async getAuthenticated(): Promise<AuthenticationResponse | null> {
    try {
      console.log("STARTING: ModMed getAuthenticated");
      
      const url = modmedFullAuthURL;
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-api-key': modmedKey,
        'Cache-Control': 'no-cache'
      };

      let data = modmedAuthenticationData;
      data = data.replace('{username}', modmedId);
      data = data.replace('{password}', modmedPassword);

      const response = await axios.post<AuthenticationResponse>(url, data, { 
        headers: headers 
      });

      console.log("ModMed AUTH RESPONSE:", response.data);

      if (response.data?.access_token) {
        this.accessToken = response.data.access_token;
        // Assume token expires in 1 hour if not specified
        this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      }

      return response.data || null;

    } catch (error: any) {
      console.error('Error in ModMed getAuthenticated:', error.response?.data || error.message);
      throw new Error(`ModMed authentication failed: ${error.response?.data || error.message}`);
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  public async getValidAccessToken(): Promise<string> {
    if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      const authResponse = await this.getAuthenticated();
      if (!authResponse?.access_token) {
        throw new Error('Failed to obtain ModMed access token');
      }
    }

    return this.accessToken!;
  }

  /**
   * Get authorization headers for ModMed API calls
   */
  public async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getValidAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'x-api-key': modmedKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Clear stored authentication data
   */
  public clearAuth(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
  }
}

// Legacy export for backward compatibility
export const getAuthenticated = async (): Promise<AuthenticationResponse | null> => {
  const authService = ModMedAuthService.getInstance();
  return authService.getAuthenticated();
};
