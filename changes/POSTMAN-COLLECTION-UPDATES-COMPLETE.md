# Postman Collection Updates - Mobile App API Implementation

## ✅ **COMPLETED UPDATES**

### 1. **Authentication Endpoints - Body Updates**

#### OAuth Token Endpoint (`POST /api/v1/auth/token`)
**UPDATED** body to use realistic credentials:
```json
{
  "grant_type": "password",
  "username": "superadmin",
  "password": "TempPass123!",
  "clientId": 1
}
```

#### Legacy Login Endpoint (`POST /api/v1/auth/login`)
**UPDATED** body to match new credentials:
```json
{
  "username": "superadmin",
  "password": "TempPass123!",
  "clientId": 1
}
```

#### Forgot Password Endpoint (`POST /api/v1/auth/forgot-password`)
**UPDATED** body with realistic email:
```json
{
  "email": "superadmin@reliacare.com"
}
```
- **Added automatic test script** to extract and store reset token in collection variable
- **Added validation tests** for successful response

#### Reset Password Endpoint (`POST /api/v1/auth/reset-password`)
**Already had proper body**:
```json
{
  "token": "{{resetToken}}",
  "newPassword": "newPassword123!"
}
```

### 2. **Mobile Profile Endpoints - Enhanced Bodies**

#### Update User Profile (`PUT /api/v1/users/profile`)
**ENHANCED** body with realistic data:
```json
{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah.johnson@reliacare.com",
  "dob": "1985-03-22",
  "gender": "female",
  "timeZone": "America/New_York"
}
```

#### Update Personal Info (`PUT /api/v1/users/profile/personal-info`)
**SIGNIFICANTLY ENHANCED** body with comprehensive healthcare data:
```json
{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "dob": "1985-03-22",
  "gender": "female",
  "phoneNumber": "+1-555-123-4567",
  "address": {
    "street": "456 Healthcare Ave",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02101",
    "country": "USA"
  },
  "emergencyContact": {
    "name": "Michael Johnson",
    "relationship": "spouse",
    "phoneNumber": "+1-555-123-4568",
    "email": "michael.johnson@email.com"
  },
  "insurance": {
    "provider": "Blue Cross Blue Shield",
    "memberId": "BC123456789",
    "groupNumber": "GRP001"
  },
  "medicalHistory": {
    "allergies": ["Penicillin", "Shellfish"],
    "medications": ["Lisinopril 10mg daily"],
    "conditions": ["Hypertension"]
  }
}
```

#### Complete Onboarding (`POST /api/v1/users/profile/complete-onboarding`)
**ENHANCED** body with detailed completion data:
```json
{
  "step": "personalInfo",
  "data": {
    "completed": true,
    "completedAt": "2025-06-17T10:30:00Z",
    "notes": "Personal information and medical history completed"
  }
}
```

#### Upload Profile Picture (`POST /api/v1/users/profile/upload-picture`)
**Already had proper** multipart/form-data setup with `profilePicture` field

### 3. **User Registration Endpoint - Enhanced Body**

#### Register User (`POST /api/v1/users/register`)
**UPDATED** with realistic healthcare user data:
```json
{
  "loginName": "sarah.johnson",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 5,
  "roles": ["PATIENT"],
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah.johnson@reliacare.com",
  "dob": "1985-03-22",
  "gender": "female",
  "sendWelcomeEmail": true,
  "temporaryPassword": false,
  "timeZone": "America/New_York"
}
```

### 4. **Collection Variables Added**

**NEW** reset token variable:
```json
{
  "key": "resetToken",
  "value": "sample-reset-token-abc123",
  "type": "string",
  "description": "Password reset token received from forgot-password endpoint"
}
```

### 5. **Documentation & Descriptions Added**

#### Mobile Profile Section
- **Folder description**: "Mobile app endpoints for user profile management, onboarding, and personal information updates"

#### Individual Endpoint Descriptions:
- **Get User Profile**: "Get complete user profile including personal info, onboarding status, and extraInfo fields"
- **Update User Profile**: "Update basic user profile information (name, email, DOB, gender, timezone)"
- **Update Personal Info**: "Update extended personal information including address, emergency contacts, insurance, and medical history"
- **Complete Onboarding**: "Mark specific onboarding steps as complete (basicInfo, personalInfo, contactInfo, preferences, profilePicture)"
- **Get Onboarding Status**: "Get current onboarding progress, completed steps, and next step to complete"
- **Upload Profile Picture**: "Upload profile picture using multipart/form-data with 'profilePicture' field"

#### Password Reset Descriptions:
- **Forgot Password**: "Initiate password reset process by sending reset token to user's email"
- **Verify Reset Token**: "Verify if a password reset token is valid and not expired"
- **Reset Password**: "Complete password reset using valid token and new password"

### 6. **Automation Features**

#### Forgot Password Test Script
- **Automatically extracts** reset token from response
- **Stores token** in collection variable `{{resetToken}}`
- **Validates response** success
- **Console logging** for debugging

## 🎯 **Key Improvements**

### Realistic Healthcare Data
- **Patient-focused** examples with healthcare-relevant fields
- **Medical history**, insurance, emergency contacts
- **Proper phone number** and address formatting
- **HIPAA-compliant** sample data structure

### Workflow Integration
- **Token auto-extraction** from forgot password
- **Consistent naming** across all endpoints
- **Proper authentication** headers on all secured endpoints
- **Realistic variable values** for testing

### Developer Experience
- **Comprehensive descriptions** for all mobile endpoints
- **Clear usage instructions** in descriptions
- **Proper request/response examples**
- **Ready-to-use sample data**

## 🧪 **Testing Workflow**

### Complete Mobile App Flow:
1. **Authenticate**: Use OAuth token or legacy login
2. **Register Patient**: Create new patient account
3. **Profile Setup**: Update basic profile information
4. **Onboarding**: Complete personal info with medical data
5. **Track Progress**: Check onboarding status
6. **Upload Picture**: Add profile picture
7. **Password Reset**: Test forgot/reset password flow

### Password Reset Flow:
1. **Forgot Password**: Automatically extracts reset token
2. **Verify Token**: Uses extracted token from collection
3. **Reset Password**: Completes with new password

The Postman collection is now **fully configured** for comprehensive mobile app API testing with realistic healthcare data and automated token management! 🎉
