# Postman Collection Updates for HIPAA Security Compliance

## Summary of Changes Made

The Postman collection has been comprehensively updated to reflect the multi-tenant security enhancements and HIPAA compliance measures implemented in the ReliaCare backend.

## 🔒 **Key Security Updates**

### 1. **Authentication & Authorization**
- **Enhanced Token Management**: Added automatic extraction and storage of `CURRENT_USER_ID` and `CURRENT_CLIENT_ID` from authentication responses
- **Bearer Token Authorization**: Ensured all endpoints that require authentication have proper `Authorization: Bearer {{RELIACARE_X_AUTH_TOKEN}}` headers
- **Client Context Variables**: Added collection variables for dynamic client context usage

### 2. **Care Plan Endpoints (NEW)**
Added a new section "🏥 Care Plans (HIPAA Secure)" with:
- `GET /api/v1/plans/users/{{userId}}/care-plan` - Get user care plan with client validation
- `PUT /api/v1/plans/users/{{userId}}/care-plan` - Update care plan with proper validation
- `GET /api/v1/plans/users/{{userId}}/injuries` - Get user injuries with client isolation
- `POST /api/v1/plans/users/{{userId}}/injuries` - Track new injury with security validation
- `GET /api/v1/plans/learning-center` - Get learning center content

**Security Features:**
- All endpoints include `userId` parameter for explicit user targeting
- Client validation ensures users can only access data within their client
- Proper authorization headers and request body validation

### 3. **Mobile App Features (NEW)**
Added "📱 Mobile App Features (HIPAA Secure)" section with:

#### Doctor Selection:
- `GET /api/v1/users/doctors` - Get available doctors (client-filtered)
- `POST /api/v1/users/doctors/select` - Select doctor with client validation

#### Mobile Registration:
- `POST /api/v1/users/mobile-register` - Mobile-specific registration
- `POST /api/v1/users/mobile-onboarding` - Complete mobile onboarding

**Security Features:**
- All endpoints use `{{CURRENT_CLIENT_ID}}` for client validation
- Device info tracking for mobile security
- Comprehensive validation of client context

### 4. **User Management Updates**
Enhanced existing user endpoints with:
- **Updated Descriptions**: Added HIPAA compliance notes
- **Security Warnings**: Highlighted client validation requirements
- **Authorization Headers**: Ensured all endpoints have proper authentication
- **Request Body Updates**: Updated registration to use `{{CURRENT_CLIENT_ID}}`

**Updated Endpoints:**
- `POST /api/v1/users/register` - Now requires clientId validation
- `GET /api/v1/users` - Added client filtering description
- `GET /api/v1/users/{{userId}}` - Added HIPAA security notes
- `PUT /api/v1/users/{{userId}}` - Added client validation warnings
- `DELETE /api/v1/users/{{userId}}` - Added security compliance notes

### 5. **TODO Management Updates**
Enhanced TODO section with "✅ Todos (HIPAA Secure)":
- **Client Filtering**: All TODO endpoints now automatically filter by client
- **Security Descriptions**: Added HIPAA compliance documentation
- **Automatic Client Assignment**: TODOs are automatically assigned to user's client
- **Access Validation**: All endpoints validate client access rights

## 🏥 **HIPAA Compliance Features**

### Data Isolation
- **Client-Scoped Queries**: All endpoints filter data by authenticated user's client
- **Cross-Client Prevention**: Prevents accidental data crossover between clients
- **User Permission Validation**: Validates user permissions for data access

### Audit Trail
- **User Context Tracking**: All requests include user and client context
- **Action Logging**: Proper logging for all data access and modifications
- **Security Event Tracking**: Enhanced monitoring for security events

### Access Control
- **Role-Based Access**: Different permission levels for different user roles
- **SuperAdmin Exceptions**: Only SuperAdmins can access cross-client data
- **Authorization Validation**: Strict authorization checks for all endpoints

## 📋 **Updated Request Bodies**

### Care Plan Request:
```json
{
    "currentInjuries": ["knee_pain", "back_strain"],
    "priorInjuries": ["ankle_sprain"],
    "goals": ["pain_reduction", "mobility_improvement"],
    "preferences": {
        "exerciseFrequency": "daily",
        "reminderTime": "09:00",
        "difficultyLevel": "beginner"
    },
    "notes": "Patient reports morning stiffness"
}
```

### Injury Tracking Request:
```json
{
    "injuryType": "muscle_strain",
    "location": "lower_back",
    "severity": "moderate",
    "painLevel": 6,
    "description": "Pain started after lifting heavy object",
    "dateOccurred": "2025-06-18",
    "symptoms": ["sharp_pain", "muscle_spasm", "limited_mobility"],
    "treatmentActions": ["ice_application", "rest"]
}
```

### Mobile Registration:
```json
{
    "firstName": "Mobile",
    "lastName": "User",
    "email": "mobile.user@reliacare.com",
    "password": "TempPass123!",
    "clientId": "{{CURRENT_CLIENT_ID}}",
    "phoneNumber": "+1-555-123-4567",
    "dob": "1990-01-15",
    "gender": "female",
    "deviceInfo": {
        "deviceType": "mobile",
        "platform": "iOS",
        "version": "16.0",
        "deviceId": "unique-device-id-123"
    },
    "acceptedTerms": true,
    "acceptedPrivacy": true
}
```

## 🔧 **Collection Variables Added**

- `CURRENT_USER_ID` - Automatically set from auth response
- `CURRENT_CLIENT_ID` - Automatically set for HIPAA security
- `doctorId` - For doctor selection and care plans
- `RELIACARE_TOKEN_TYPE` - Token type tracking
- `RELIACARE_REFRESH_TOKEN` - For token renewal

## 🎯 **Testing Workflow**

1. **Authenticate First**: Run "OAuth Token (Password Grant)" to set authentication variables
2. **Verify Variables**: Check that `CURRENT_USER_ID` and `CURRENT_CLIENT_ID` are populated
3. **Test Endpoints**: All endpoints now automatically use proper client context
4. **Security Validation**: Test that cross-client access is properly blocked
5. **Role-Based Testing**: Test different user roles for proper permission validation

## 🛡️ **Security Testing Recommendations**

1. **Multi-Tenant Testing**: Test with users from different clients to ensure data isolation
2. **Permission Testing**: Test with different user roles to verify access controls
3. **Cross-Client Validation**: Attempt to access other clients' data (should be blocked)
4. **Authorization Testing**: Test endpoints without proper tokens (should fail)
5. **Data Validation**: Verify that client context is maintained throughout workflows

This updated collection now provides comprehensive testing capabilities for the secure, HIPAA-compliant multi-tenant ReliaCare backend system.
