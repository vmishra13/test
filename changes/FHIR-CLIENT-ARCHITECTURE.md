# 🔌 Generic FHIR Client Integration Architecture

## 🎯 **Proposed Architecture: FHIR Abstraction Layer**

### **1. Core FHIR Interface**
```typescript
// src/shared/interfaces/fhir-client.interface.ts
export interface IFHIRClient {
  // Authentication
  authenticate(): Promise<AuthResponse>;
  
  // Resource Operations
  search<T>(resourceType: string, params: FHIRSearchParams): Promise<FHIRBundle<T>>;
  read<T>(resourceType: string, id: string): Promise<T>;
  create<T>(resource: T): Promise<T>;
  update<T>(resource: T): Promise<T>;
  delete(resourceType: string, id: string): Promise<void>;
  
  // Configuration
  setBaseUrl(url: string): void;
  setHeaders(headers: Record<string, string>): void;
}
```

### **2. Generic FHIR Client Implementation**
```typescript
// src/services/fhir/generic-fhir.client.ts
export class GenericFHIRClient implements IFHIRClient {
  private baseUrl: string;
  private headers: Record<string, string> = {};
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async search<T>(resourceType: string, params: FHIRSearchParams): Promise<FHIRBundle<T>> {
    const url = this.buildSearchUrl(resourceType, params);
    const response = await axios.get(url, { headers: this.headers });
    return response.data;
  }
  
  // ... other FHIR operations
}
```

### **3. ModMed-Specific FHIR Client**
```typescript
// src/services/fhir/modmed-fhir.client.ts
export class ModMedFHIRClient extends GenericFHIRClient {
  private firmPrefix: string;
  private apiKey: string;
  
  constructor(baseUrl: string, firmPrefix: string, apiKey: string) {
    // Apply firm prefix to base URL
    const modmedUrl = baseUrl.replace('{firm_url_prefix}', firmPrefix);
    super(modmedUrl);
    
    this.firmPrefix = firmPrefix;
    this.apiKey = apiKey;
  }
  
  async authenticate(): Promise<AuthResponse> {
    // ModMed-specific authentication logic
    const authUrl = this.modmedFullAuthURL;
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-api-key': this.apiKey,
      'Cache-Control': 'no-cache'
    };
    
    // ... ModMed authentication implementation
  }
  
  setAuthenticatedHeaders(token: string): void {
    this.setHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-api-key': this.apiKey,
      'Cache-Control': 'no-cache',
      'Authorization': `Bearer ${token}`
    });
  }
}
```

### **4. FHIR Client Factory**
```typescript
// src/services/fhir/fhir-client.factory.ts
export enum FHIRProvider {
  MODMED = 'modmed',
  EPIC = 'epic',
  CERNER = 'cerner',
  ALLSCRIPTS = 'allscripts',
  GENERIC = 'generic'
}

export class FHIRClientFactory {
  static createClient(provider: FHIRProvider, config: FHIRClientConfig): IFHIRClient {
    switch (provider) {
      case FHIRProvider.MODMED:
        return new ModMedFHIRClient(
          config.baseUrl,
          config.firmPrefix,
          config.apiKey
        );
      
      case FHIRProvider.EPIC:
        return new EpicFHIRClient(config.baseUrl, config.clientId, config.clientSecret);
      
      case FHIRProvider.CERNER:
        return new CernerFHIRClient(config.baseUrl, config.apiKey);
      
      default:
        return new GenericFHIRClient(config.baseUrl);
    }
  }
}
```

### **5. Unified Healthcare Service**
```typescript
// src/services/healthcare.service.ts
export class HealthcareService {
  private fhirClient: IFHIRClient;
  
  constructor(provider: FHIRProvider, config: FHIRClientConfig) {
    this.fhirClient = FHIRClientFactory.createClient(provider, config);
  }
  
  // Universal methods that work with any FHIR provider
  async searchPatients(firstName: string, lastName: string, dob: string): Promise<Patient[]> {
    const searchParams = {
      family: lastName,
      given: firstName,
      birthdate: dob
    };
    
    const bundle = await this.fhirClient.search<Patient>('Patient', searchParams);
    return bundle.entry?.map(entry => entry.resource) || [];
  }
  
  async getPatientMedications(patientId: string): Promise<MedicationRequest[]> {
    const searchParams = { patient: patientId };
    const bundle = await this.fhirClient.search<MedicationRequest>('MedicationRequest', searchParams);
    return bundle.entry?.map(entry => entry.resource) || [];
  }
  
  async getPatientConditions(patientId: string): Promise<Condition[]> {
    const searchParams = { patient: patientId };
    const bundle = await this.fhirClient.search<Condition>('Condition', searchParams);
    return bundle.entry?.map(entry => entry.resource) || [];
  }
  
  // ... other universal healthcare operations
}
```

## 🔧 **Migration Strategy**

### **Phase 1: FHIR Abstraction Layer**
1. Create the FHIR client interface
2. Implement generic FHIR client
3. Migrate ModMed to use the abstraction layer

### **Phase 2: Additional Provider Support**
1. Add Epic FHIR client
2. Add Cerner FHIR client  
3. Add other providers as needed

### **Phase 3: Advanced Features**
1. FHIR capability statement parsing
2. Automatic resource discovery
3. Cross-provider data normalization

## 📊 **Benefits of This Approach**

### **✅ Immediate Benefits:**
- **Provider Flexibility**: Easy to switch between FHIR providers
- **Standardization**: Consistent API across different EHR systems
- **Maintainability**: Centralized FHIR logic
- **Testing**: Mock FHIR providers for testing

### **✅ Long-term Benefits:**
- **Multi-Provider Support**: Connect to multiple EHR systems simultaneously
- **Vendor Independence**: Reduce vendor lock-in
- **FHIR Compliance**: Automatic compliance with FHIR standards
- **Future-Proofing**: Easy integration with new FHIR-compliant systems

## 🚀 **Implementation Priority**

### **High Priority:**
- FHIR client interface
- ModMed FHIR client implementation
- Basic resource operations (Patient, Medication, Condition)

### **Medium Priority:**  
- Generic FHIR client
- Additional provider support
- Advanced search capabilities

### **Low Priority:**
- Cross-provider data synchronization
- FHIR capability statement integration
- Advanced FHIR features (subscriptions, etc.)

## 🔍 **Next Steps**

1. **Research**: Investigate other target FHIR providers (Epic, Cerner, etc.)
2. **Design**: Finalize the FHIR abstraction interface
3. **Migrate**: Gradually migrate existing ModMed code to use the abstraction
4. **Extend**: Add support for additional FHIR providers
5. **Optimize**: Add provider-specific optimizations as needed

This architecture provides the flexibility of generic FHIR clients while maintaining the ability to leverage ModMed-specific optimizations where beneficial.
