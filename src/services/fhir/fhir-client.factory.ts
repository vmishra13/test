/**
 * FHIR Client Factory
 * Creates FHIR clients for different providers
 */

import { IFHIRClient } from '../../shared/interfaces/fhir-client.interface';
import { GenericFHIRClient } from './generic-fhir.client';
import { ModMedFhirClient } from './modmed-fhir.client';

export enum FHIRProvider {
  MODMED = 'modmed',
  EPIC = 'epic',
  CERNER = 'cerner',
  GENERIC = 'generic'
}

export interface FHIRProviderConfig {
  provider: FHIRProvider;
  baseUrl?: string;
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  [key: string]: any;
}

/**
 * Factory class for creating FHIR clients
 */
export class FHIRClientFactory {
  /**
   * Create a FHIR client for the specified provider
   */
  static createClient(config: FHIRProviderConfig): IFHIRClient {
    switch (config.provider) {
      case FHIRProvider.MODMED:
        return new ModMedFhirClient();
        
      case FHIRProvider.EPIC:
        // TODO: Implement Epic FHIR client
        throw new Error('Epic FHIR client not yet implemented');
        
      case FHIRProvider.CERNER:
        // TODO: Implement Cerner FHIR client
        throw new Error('Cerner FHIR client not yet implemented');
        
      case FHIRProvider.GENERIC:
      default:
        return new GenericFHIRClient({
          baseUrl: config.baseUrl || '',
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          apiKey: config.apiKey
        });
    }
  }

  /**
   * Get available providers
   */
  static getAvailableProviders(): FHIRProvider[] {
    return [
      FHIRProvider.MODMED,
      FHIRProvider.GENERIC
      // FHIRProvider.EPIC,     // TODO: Uncomment when implemented
      // FHIRProvider.CERNER    // TODO: Uncomment when implemented
    ];
  }

  /**
   * Check if a provider is supported
   */
  static isProviderSupported(provider: string): boolean {
    return Object.values(FHIRProvider).includes(provider as FHIRProvider);
  }

  /**
   * Create a ModMed client (convenience method)
   */
  static createModMedClient(): ModMedFhirClient {
    return new ModMedFhirClient();
  }

  /**
   * Create a generic FHIR client (convenience method)
   */
  static createGenericClient(baseUrl: string, config?: Partial<FHIRProviderConfig>): GenericFHIRClient {
    return new GenericFHIRClient({
      baseUrl,
      clientId: config?.clientId,
      clientSecret: config?.clientSecret,
      apiKey: config?.apiKey
    });
  }
}

export default FHIRClientFactory;
