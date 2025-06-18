# /users/register API - Postman Test Cases

## Prerequisites

- Base URL: `{{baseUrl}}/api/users`
- Authentication: Bearer token from login
- Content-Type: application/json

## Authentication Setup

First, get your access token using the SUPER_ADMIN credentials:

**POST** `{{baseUrl}}/auth/login`

```json
{
  "grant_type": "password",
  "username": "superadmin",
  "password": "TempPass123!",
  "clientId": 1
}
```

---

## Test Case 1: SUPER_ADMIN Creates CLIENT_ADMIN

**Scenario**: SUPER_ADMIN registers a new CLIENT_ADMIN user
**Expected**: ✅ SUCCESS

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "michael.rodriguez",
  "password": "ClientPass123!",
  "clientId": 1,
  "userTypeId": 2,
  "firstName": "Michael",
  "lastName": "Rodriguez",
  "email": "michael.rodriguez@reliacare.com",
  "roles": ["CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

## Test Case 2: SUPER_ADMIN Creates CLINICAL_STAFF

**Scenario**: SUPER_ADMIN registers a new CLINICAL_STAFF user
**Expected**: ✅ SUCCESS

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "dr.sarah.chen",
  "password": "DoctorPass123!",
  "clientId": 1,
  "userTypeId": 3,
  "firstName": "Dr. Sarah",
  "lastName": "Chen",
  "email": "sarah.chen@reliacare.com",
  "roles": ["CLINICAL_STAFF"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

## Test Case 3: SUPER_ADMIN Creates OFFICE_STAFF

**Scenario**: SUPER_ADMIN registers a new OFFICE_STAFF user
**Expected**: ✅ SUCCESS

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "maria.thompson",
  "password": "OfficePass123!",
  "clientId": 1,
  "userTypeId": 4,
  "firstName": "Maria",
  "lastName": "Thompson",
  "email": "maria.thompson@reliacare.com",
  "roles": ["OFFICE_STAFF"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

## Test Case 4: SUPER_ADMIN Creates PATIENT

**Scenario**: SUPER_ADMIN registers a new PATIENT user
**Expected**: ✅ SUCCESS

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "robert.williams",
  "password": "PatientPass123!",
  "clientId": 1,
  "userTypeId": 5,
  "firstName": "Robert",
  "lastName": "Williams",
  "email": "robert.williams@gmail.com",
  "roles": ["PATIENT"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": false
}
```

---

## Test Case 5: SUPER_ADMIN Cross-Client Registration

**Scenario**: SUPER_ADMIN registers user in different client (if client 2 exists)
**Expected**: ✅ SUCCESS (SUPER_ADMIN can register across clients)

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "jennifer.davis",
  "password": "CrossPass123!",
  "clientId": 2,
  "userTypeId": 2,
  "firstName": "Jennifer",
  "lastName": "Davis",
  "email": "jennifer.davis@healthpartners.com",
  "roles": ["CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

## Test Case 6: SUPER_ADMIN Attempts to Create Another SUPER_ADMIN

**Scenario**: SUPER_ADMIN tries to register another SUPER_ADMIN
**Expected**: ❌ FORBIDDEN (Cannot register SUPER_ADMIN users)

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "admin.duplicate",
  "password": "SuperPass123!",
  "clientId": 1,
  "userTypeId": 1,
  "firstName": "Unauthorized",
  "lastName": "SuperAdmin",
  "email": "unauthorized.super@reliacare.com",
  "roles": ["SUPER_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

## Test Case 7: CLIENT_ADMIN Creates CLINICAL_STAFF (After Test Case 1)

**Scenario**: Use CLIENT_ADMIN token to register CLINICAL_STAFF
**Expected**: ✅ SUCCESS

**Prerequisites**: First login as the CLIENT_ADMIN created in Test Case 1
**POST** `{{baseUrl}}/auth/login`

```json
{
  "grant_type": "password",
  "username": "michael.rodriguez",
  "password": "ClientPass123!",
  "clientId": 1
}
```

Then register:
**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{clientAdminToken}}`

```json
{
  "loginName": "emily.anderson",
  "password": "NursePass123!",
  "clientId": 1,
  "userTypeId": 3,
  "firstName": "Emily",
  "lastName": "Anderson",
  "email": "emily.anderson@reliacare.com",
  "roles": ["CLINICAL_STAFF"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

## Test Case 8: CLIENT_ADMIN Attempts to Create Another CLIENT_ADMIN

**Scenario**: CLIENT_ADMIN tries to register another CLIENT_ADMIN
**Expected**: ❌ FORBIDDEN (CLIENT_ADMIN cannot create CLIENT_ADMIN)

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{clientAdminToken}}`

```json
{
  "loginName": "admin.duplicate2",
  "password": "ClientPass123!",
  "clientId": 1,
  "userTypeId": 2,
  "firstName": "Unauthorized",
  "lastName": "AdminAttempt",
  "email": "unauthorized.admin@reliacare.com",
  "roles": ["CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

## Test Case 9: CLINICAL_STAFF Creates PATIENT (After Test Case 2)

**Scenario**: Use CLINICAL_STAFF token to register PATIENT
**Expected**: ✅ SUCCESS

**Prerequisites**: First login as the CLINICAL_STAFF created in Test Case 2
**POST** `{{baseUrl}}/auth/login`

```json
{
  "grant_type": "password",
  "username": "dr.sarah.chen",
  "password": "DoctorPass123!",
  "clientId": 1
}
```

Then register:
**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{clinicalStaffToken}}`

```json
{
  "loginName": "amanda.martinez",
  "password": "PatientPass123!",
  "clientId": 1,
  "userTypeId": 5,
  "firstName": "Amanda",
  "lastName": "Martinez",
  "email": "amanda.martinez@gmail.com",
  "roles": ["PATIENT"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": false
}
```

---

## Test Case 10: CLINICAL_STAFF Attempts to Create OFFICE_STAFF

**Scenario**: CLINICAL_STAFF tries to register OFFICE_STAFF
**Expected**: ❌ FORBIDDEN (CLINICAL_STAFF can only create PATIENT)

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{clinicalStaffToken}}`

```json
{
  "loginName": "office.unauthorized",
  "password": "OfficePass123!",
  "clientId": 1,
  "userTypeId": 4,
  "firstName": "Unauthorized",
  "lastName": "OfficeStaff",
  "email": "unauthorized.office@reliacare.com",
  "roles": ["OFFICE_STAFF"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

## Test Case 11: PATIENT Attempts to Create Any User (After Test Case 4)

**Scenario**: PATIENT tries to register another user
**Expected**: ❌ FORBIDDEN (PATIENT cannot create any users)

**Prerequisites**: First login as the PATIENT created in Test Case 4
**POST** `{{baseUrl}}/auth/login`

```json
{
  "grant_type": "password",
  "username": "robert.williams",
  "password": "PatientPass123!",
  "clientId": 1
}
```

Then attempt registration:
**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{patientToken}}`

```json
{
  "loginName": "patient.unauthorized",
  "password": "UnauthorizedPass123!",
  "clientId": 1,
  "userTypeId": 5,
  "firstName": "Unauthorized",
  "lastName": "PatientAttempt",
  "email": "unauthorized.patient@gmail.com",
  "roles": ["PATIENT"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": false
}
```

---

## Test Case 12: Cross-Client Registration Attempt

**Scenario**: CLIENT_ADMIN tries to register user in different client
**Expected**: ❌ FORBIDDEN (CLIENT_ADMIN restricted to same client)

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{clientAdminToken}}`

```json
{
  "loginName": "cross.client.unauthorized",
  "password": "CrossPass123!",
  "clientId": 2,
  "userTypeId": 3,
  "firstName": "Unauthorized",
  "lastName": "CrossClient",
  "email": "unauthorized.cross@healthpartners.com",
  "roles": ["CLINICAL_STAFF"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

## Test Case 13: Invalid Data - Missing Required Fields

**Scenario**: Submit registration with missing required fields
**Expected**: ❌ BAD_REQUEST (Validation error)

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "incomplete.user",
  "clientId": 1,
  "roles": ["PATIENT"]
}
```

---

## Test Case 14: Invalid Data - Invalid Role

**Scenario**: Submit registration with invalid role
**Expected**: ❌ BAD_REQUEST (Validation error)

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "invalid.role.user",
  "password": "InvalidPass123!",
  "clientId": 1,
  "userTypeId": 5,
  "firstName": "Invalid",
  "lastName": "RoleTest",
  "email": "invalid.role@gmail.com",
  "roles": ["INVALID_ROLE"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": false
}
```

---

## Test Case 15: Duplicate User Registration

**Scenario**: Attempt to register user with existing loginName
**Expected**: ❌ CONFLICT (User already exists)

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "duplicate.superadmin",
  "password": "DuplicatePass123!",
  "clientId": 1,
  "userTypeId": 2,
  "firstName": "Duplicate",
  "lastName": "SuperAdminTest",
  "email": "duplicate.super@reliacare.com",
  "roles": ["CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

## Expected Response Formats

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "loginName": "dr.sarah.chen",
      "firstName": "Dr. Sarah",
      "lastName": "Chen",
      "email": "sarah.chen@reliacare.com",
      "clientId": 1,
      "userTypeId": 3,
      "status": "ACTIVE",
      "createdAt": "2025-06-17T10:30:00Z"
    },
    "roles": ["CLINICAL_STAFF"],
    "temporaryPassword": null
  },
  "message": "User registered successfully",
  "timestamp": "2025-06-17T10:30:00Z"
}
```

### Authorization Error (403 Forbidden)

```json
{
  "success": false,
  "error": "Authorization failed",
  "details": "You do not have permission to perform this action",
  "timestamp": "2025-06-17T10:30:00Z"
}
```

### Validation Error (400 Bad Request)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "password",
      "message": "Password is required"
    }
  ],
  "timestamp": "2025-06-17T10:30:00Z"
}
```

### Conflict Error (409 Conflict)

```json
{
  "success": false,
  "error": "User already exists",
  "details": "A user with loginName 'superadmin' already exists",
  "timestamp": "2025-06-17T10:30:00Z"
}
```

---

## Postman Test Script for Environment Variables

Add this test script to automatically save tokens:

```javascript
// Test script for /auth/login endpoint
if (pm.response.code === 200) {
  const response = pm.response.json();
  if (response.success && response.data && response.data.accessToken) {
    pm.environment.set('accessToken', response.data.accessToken);
    pm.environment.set('refreshToken', response.data.refreshToken);
    console.log('✅ Tokens saved successfully');
  }
}

// Test script for /users/register endpoint
pm.test('Status code validation', function () {
  const expectedStatuses = [200, 201, 400, 401, 403, 409];
  pm.expect(expectedStatuses).to.include(pm.response.code);
});

pm.test('Response has correct structure', function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('success');
  pm.expect(jsonData).to.have.property('timestamp');
});

if (pm.response.code === 201) {
  pm.test('Successful registration response', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data).to.have.property('user');
    pm.expect(jsonData.data.user).to.have.property('id');
    pm.expect(jsonData.data.user).to.have.property('loginName');
  });
}
```
