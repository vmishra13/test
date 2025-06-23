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
  "password": "TempPass123!",
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
  "password": "TempPass123!",
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
  "password": "TempPass123!",
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
  "password": "TempPass123!",
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
  "password": "TempPass123!",
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
  "password": "TempPass123!",
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
  "password": "TempPass123!",
  "clientId": 1
}
```

Then register:
**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{clientAdminToken}}`

```json
{
  "loginName": "emily.anderson",
  "password": "TempPass123!",
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
  "password": "TempPass123!",
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
  "password": "TempPass123!",
  "clientId": 1
}
```

Then register:
**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{clinicalStaffToken}}`

```json
{
  "loginName": "amanda.martinez",
  "password": "TempPass123!",
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
  "password": "TempPass123!",
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
  "password": "TempPass123!",
  "clientId": 1
}
```

Then attempt registration:
**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{patientToken}}`

```json
{
  "loginName": "patient.unauthorized",
  "password": "TempPass123!",
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
  "password": "TempPass123!",
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
  "password": "TempPass123!",
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
  "password": "TempPass123!",
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

## Multi-Role User Registration Test Cases

### Test Case 16: SUPER_ADMIN Creates CLINICAL_STAFF + CLIENT_ADMIN

**Scenario**: SUPER_ADMIN registers a user with both CLINICAL_STAFF and CLIENT_ADMIN roles
**Expected**: ✅ SUCCESS

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "dr.james.mitchell",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 3,
  "firstName": "Dr. James",
  "lastName": "Mitchell",
  "email": "james.mitchell@reliacare.com",
  "roles": ["CLINICAL_STAFF", "CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

### Test Case 17: SUPER_ADMIN Creates OFFICE_STAFF + CLIENT_ADMIN

**Scenario**: SUPER_ADMIN registers a user with both OFFICE_STAFF and CLIENT_ADMIN roles
**Expected**: ✅ SUCCESS

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "lisa.johnson",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 4,
  "firstName": "Lisa",
  "lastName": "Johnson",
  "email": "lisa.johnson@reliacare.com",
  "roles": ["OFFICE_STAFF", "CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

### Test Case 18: CLIENT_ADMIN Creates CLINICAL_STAFF + CLIENT_ADMIN

**Scenario**: CLIENT_ADMIN registers a user with dual roles
**Expected**: ✅ SUCCESS

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{clientAdminToken}}`

```json
{
  "loginName": "dr.nicole.brown",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 3,
  "firstName": "Dr. Nicole",
  "lastName": "Brown",
  "email": "nicole.brown@reliacare.com",
  "roles": ["CLINICAL_STAFF", "CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

### Test Case 19: CLIENT_ADMIN Creates OFFICE_STAFF + CLIENT_ADMIN

**Scenario**: CLIENT_ADMIN registers a user with OFFICE_STAFF + CLIENT_ADMIN roles
**Expected**: ✅ SUCCESS

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{clientAdminToken}}`

```json
{
  "loginName": "karen.white",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 4,
  "firstName": "Karen",
  "lastName": "White",
  "email": "karen.white@reliacare.com",
  "roles": ["OFFICE_STAFF", "CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

### Test Case 20: Multi-Role User (CLINICAL_STAFF + CLIENT_ADMIN) Creates Another Multi-Role User

**Scenario**: User with CLINICAL_STAFF + CLIENT_ADMIN creates another dual-role user
**Expected**: ✅ SUCCESS

**Prerequisites**: First login as the multi-role user created in Test Case 16
**POST** `{{baseUrl}}/auth/login`

```json
{
  "grant_type": "password",
  "username": "dr.james.mitchell",
  "password": "TempPass123!",
  "clientId": 1
}
```

Then register:
**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{multiRoleToken}}`

```json
{
  "loginName": "dr.patricia.garcia",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 3,
  "firstName": "Dr. Patricia",
  "lastName": "Garcia",
  "email": "patricia.garcia@reliacare.com",
  "roles": ["CLINICAL_STAFF", "CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

### Test Case 21: Multi-Role User (OFFICE_STAFF + CLIENT_ADMIN) Creates CLINICAL_STAFF

**Scenario**: User with OFFICE_STAFF + CLIENT_ADMIN creates single-role CLINICAL_STAFF
**Expected**: ✅ SUCCESS

**Prerequisites**: First login as the multi-role user created in Test Case 17
**POST** `{{baseUrl}}/auth/login`

```json
{
  "grant_type": "password",
  "username": "lisa.johnson",
  "password": "TempPass123!",
  "clientId": 1
}
```

Then register:
**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{officeAdminToken}}`

```json
{
  "loginName": "dr.kevin.taylor",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 3,
  "firstName": "Dr. Kevin",
  "lastName": "Taylor",
  "email": "kevin.taylor@reliacare.com",
  "roles": ["CLINICAL_STAFF"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

### Test Case 22: Invalid Multi-Role - PATIENT with Other Roles

**Scenario**: Attempt to create user with PATIENT + another role (invalid combination)
**Expected**: ❌ BAD_REQUEST (Role combination validation error)

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "invalid.patient.combo",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 5,
  "firstName": "Invalid",
  "lastName": "PatientCombo",
  "email": "invalid.combo@gmail.com",
  "roles": ["PATIENT", "CLINICAL_STAFF"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": false
}
```

---

### Test Case 23: Invalid Multi-Role - SUPER_ADMIN with Other Roles

**Scenario**: Attempt to create user with SUPER_ADMIN + another role (invalid combination)
**Expected**: ❌ BAD_REQUEST (Role combination validation error)

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "invalid.super.combo",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 1,
  "firstName": "Invalid",
  "lastName": "SuperCombo",
  "email": "invalid.super.combo@reliacare.com",
  "roles": ["SUPER_ADMIN", "CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

### Test Case 24: Invalid Multi-Role - Three or More Roles

**Scenario**: Attempt to create user with more than 2 roles (exceeds maximum)
**Expected**: ❌ BAD_REQUEST (Too many roles)

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{accessToken}}`

```json
{
  "loginName": "too.many.roles",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 2,
  "firstName": "Too",
  "lastName": "ManyRoles",
  "email": "too.many@reliacare.com",
  "roles": ["CLIENT_ADMIN", "CLINICAL_STAFF", "OFFICE_STAFF"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

### Test Case 25: Single-Role CLINICAL_STAFF Attempts Multi-Role Creation

**Scenario**: Single-role CLINICAL_STAFF tries to create multi-role user
**Expected**: ❌ FORBIDDEN (Insufficient permissions)

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{clinicalStaffToken}}`

```json
{
  "loginName": "unauthorized.multirole",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 3,
  "firstName": "Unauthorized",
  "lastName": "MultiRole",
  "email": "unauthorized.multi@reliacare.com",
  "roles": ["CLINICAL_STAFF", "CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

### Test Case 26: Cross-Client Multi-Role Attempt

**Scenario**: CLIENT_ADMIN tries to create multi-role user in different client
**Expected**: ❌ FORBIDDEN (Cross-client restriction)

**POST** `{{baseUrl}}/api/users/register`
**Headers**: `Authorization: Bearer {{clientAdminToken}}`

```json
{
  "loginName": "cross.client.multirole",
  "password": "TempPass123!",
  "clientId": 2,
  "userTypeId": 3,
  "firstName": "Cross",
  "lastName": "ClientMulti",
  "email": "cross.multi@healthpartners.com",
  "roles": ["CLINICAL_STAFF", "CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

---

### Test Case 27: OFFICE_STAFF + CLIENT_ADMIN Creates Multiple Role Types

**Scenario**: Multi-role user creates users with various role combinations
**Expected**: ✅ SUCCESS for valid combinations

**Prerequisites**: Login as OFFICE_STAFF + CLIENT_ADMIN user

**Sub-test 27a: Create single CLIENT_ADMIN**

```json
{
  "loginName": "single.client.admin",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 2,
  "firstName": "Single",
  "lastName": "ClientAdmin",
  "email": "single.admin@reliacare.com",
  "roles": ["CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

**Sub-test 27b: Create OFFICE_STAFF + CLIENT_ADMIN**

```json
{
  "loginName": "another.office.admin",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 4,
  "firstName": "Another",
  "lastName": "OfficeAdmin",
  "email": "another.office@reliacare.com",
  "roles": ["OFFICE_STAFF", "CLIENT_ADMIN"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": true
}
```

**Sub-test 27c: Create single PATIENT**

```json
{
  "loginName": "patient.from.office",
  "password": "TempPass123!",
  "clientId": 1,
  "userTypeId": 5,
  "firstName": "Patient",
  "lastName": "FromOffice",
  "email": "patient.office@gmail.com",
  "roles": ["PATIENT"],
  "timeZone": "America/New_York",
  "sendWelcomeEmail": false
}
```

---

## Enhanced Postman Test Scripts for Multi-Role Testing

Add these enhanced test scripts to automatically handle multi-role scenarios:

### Login Endpoint Test Script

```javascript
// Test script for /auth/login endpoint
if (pm.response.code === 200) {
  const response = pm.response.json();
  if (response.success && response.data && response.data.accessToken) {
    pm.environment.set('accessToken', response.data.accessToken);
    pm.environment.set('refreshToken', response.data.refreshToken);
    console.log('✅ Tokens saved successfully');

    // Save user info for context
    if (response.data.user) {
      pm.environment.set('currentUserId', response.data.user.id);
      pm.environment.set('currentUserRoles', JSON.stringify(response.data.user.roles));
      pm.environment.set('currentUserClient', response.data.user.clientId);
    }
  }
}
```

### Registration Endpoint Test Script

```javascript
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
    pm.expect(jsonData.data).to.have.property('roles');
    pm.expect(jsonData.data.roles).to.be.an('array');
  });

  // Save different token types based on roles for multi-role testing
  pm.test('Save tokens by role type', function () {
    const request = JSON.parse(pm.request.body.raw);
    const loginName = request.loginName;
    const roles = request.roles;

    // Save tokens for later use in subsequent tests
    if (roles.includes('CLIENT_ADMIN') && roles.includes('CLINICAL_STAFF')) {
      pm.environment.set('multiRoleClinicalAdminUser', loginName);
      pm.environment.set('multiRoleClinicalAdminPassword', request.password);
      console.log('✅ Multi-role (Clinical+Admin) user saved for login');
    } else if (roles.includes('CLIENT_ADMIN') && roles.includes('OFFICE_STAFF')) {
      pm.environment.set('multiRoleOfficeAdminUser', loginName);
      pm.environment.set('multiRoleOfficeAdminPassword', request.password);
      console.log('✅ Office+Admin user saved for login');
    } else if (roles.includes('CLIENT_ADMIN') && roles.length === 1) {
      pm.environment.set('clientAdminUser', loginName);
      pm.environment.set('clientAdminPassword', request.password);
      console.log('✅ Client Admin user saved for login');
    } else if (roles.includes('CLINICAL_STAFF') && roles.length === 1) {
      pm.environment.set('clinicalStaffUser', loginName);
      pm.environment.set('clinicalStaffPassword', request.password);
      console.log('✅ Clinical Staff user saved for login');
    } else if (roles.includes('PATIENT')) {
      pm.environment.set('patientUser', loginName);
      pm.environment.set('patientPassword', request.password);
      console.log('✅ Patient user saved for login');
    }
  });

  // Multi-role specific validation
  pm.test('Multi-role validation', function () {
    const request = JSON.parse(pm.request.body.raw);
    const roles = request.roles;

    // Test valid multi-role combinations
    if (roles.length > 1) {
      pm.expect(roles.length).to.be.at.most(2, 'Should not have more than 2 roles');

      // PATIENT should never be combined with other roles
      if (roles.includes('PATIENT')) {
        pm.expect(roles.length).to.equal(1, 'PATIENT role should be standalone');
      }

      // SUPER_ADMIN should never be combined with other roles
      if (roles.includes('SUPER_ADMIN')) {
        pm.expect(roles.length).to.equal(1, 'SUPER_ADMIN role should be standalone');
      }

      // Valid combinations: CLINICAL_STAFF+CLIENT_ADMIN or OFFICE_STAFF+CLIENT_ADMIN
      if (roles.length === 2) {
        const validCombinations = [
          ['CLINICAL_STAFF', 'CLIENT_ADMIN'],
          ['OFFICE_STAFF', 'CLIENT_ADMIN'],
        ];

        const isValidCombo = validCombinations.some(combo =>
          combo.every(role => roles.includes(role)),
        );
        pm.expect(isValidCombo).to.be.true;
        console.log(`✅ Valid multi-role combination: ${roles.join(' + ')}`);
      }
    }
  });
}

// Role combination error validation
if (pm.response.code === 400) {
  pm.test('Role combination error validation', function () {
    const jsonData = pm.response.json();
    if (
      jsonData.error &&
      (jsonData.error.includes('role') || jsonData.error.includes('combination'))
    ) {
      pm.expect(jsonData.success).to.be.false;
      pm.expect(jsonData).to.have.property('details');
      console.log(`❌ Expected role combination error: ${jsonData.details}`);
    }
  });
}

// Authorization error validation
if (pm.response.code === 403) {
  pm.test('Authorization error validation', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.false;
    pm.expect(jsonData.error).to.include('Authorization');
    console.log(`❌ Expected authorization error: ${jsonData.details || jsonData.error}`);
  });
}

// Conflict error validation (duplicate user)
if (pm.response.code === 409) {
  pm.test('Conflict error validation', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.false;
    pm.expect(jsonData.error).to.include('exists');
    console.log(`❌ Expected conflict error: ${jsonData.details || jsonData.error}`);
  });
}
```

### Pre-Request Script for Role-Based Authentication

```javascript
// Pre-request script to automatically set the correct token based on test scenario
const testName = pm.info.requestName;
const currentToken = pm.environment.get('accessToken');

// If we need a specific role token and don't have it, skip auto-token setting
if (testName.includes('CLIENT_ADMIN') && !testName.includes('SUPER_ADMIN')) {
  if (pm.environment.get('clientAdminToken')) {
    pm.request.headers.add({
      key: 'Authorization',
      value: `Bearer ${pm.environment.get('clientAdminToken')}`,
    });
  }
} else if (testName.includes('CLINICAL_STAFF') && !testName.includes('Multi-Role')) {
  if (pm.environment.get('clinicalStaffToken')) {
    pm.request.headers.add({
      key: 'Authorization',
      value: `Bearer ${pm.environment.get('clinicalStaffToken')}`,
    });
  }
} else if (testName.includes('Multi-Role') && testName.includes('CLINICAL')) {
  if (pm.environment.get('multiRoleToken')) {
    pm.request.headers.add({
      key: 'Authorization',
      value: `Bearer ${pm.environment.get('multiRoleToken')}`,
    });
  }
} else if (testName.includes('OFFICE_STAFF')) {
  if (pm.environment.get('officeAdminToken')) {
    pm.request.headers.add({
      key: 'Authorization',
      value: `Bearer ${pm.environment.get('officeAdminToken')}`,
    });
  }
} else if (testName.includes('PATIENT')) {
  if (pm.environment.get('patientToken')) {
    pm.request.headers.add({
      key: 'Authorization',
      value: `Bearer ${pm.environment.get('patientToken')}`,
    });
  }
}

console.log(`🔍 Test: ${testName}`);
console.log(`🎯 Using token type: ${pm.request.headers.get('Authorization') ? 'Set' : 'Default'}`);
```

---

## Test Execution Order for Multi-Role Scenarios

To properly test multi-role scenarios, execute the tests in this order:

### Phase 1: Basic Setup

1. **Login as SUPER_ADMIN** (save accessToken)
2. **Test Case 1-5**: Single-role user creation by SUPER_ADMIN
3. **Test Case 16-17**: Multi-role user creation by SUPER_ADMIN

### Phase 2: Multi-Role User Testing

4. **Test Case 18-19**: Multi-role user creation by CLIENT_ADMIN
5. **Test Case 20**: Multi-role user creates another multi-role user
6. **Test Case 21**: Multi-role user creates single-role user
7. **Test Case 27**: Comprehensive multi-role capabilities test

### Phase 3: Validation Testing

8. **Test Case 22-24**: Invalid role combinations
9. **Test Case 25-26**: Permission violations
10. **Test Case 13-15**: Data validation and conflicts

### Phase 4: Advanced Scenarios

11. **Test Case 7-12**: Single-role user limitations
12. Cross-client testing (if multiple clients available)

---

## Environment Variables for Multi-Role Testing

Set up these environment variables in Postman:

```
baseUrl: http://localhost:3000
accessToken: (automatically set by login)
refreshToken: (automatically set by login)
clientAdminToken: (automatically set by user creation)
clinicalStaffToken: (automatically set by user creation)
multiRoleToken: (automatically set by multi-role user creation)
officeAdminToken: (automatically set by office+admin user creation)
patientToken: (automatically set by patient creation)

# User credentials for re-login
clientAdminUser: (automatically set)
clientAdminPassword: (automatically set)
multiRoleClinicalAdminUser: (automatically set)
multiRoleClinicalAdminPassword: (automatically set)
multiRoleOfficeAdminUser: (automatically set)
multiRoleOfficeAdminPassword: (automatically set)
```
