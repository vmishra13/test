# User Registration/Creation Authorization Matrix

## Overview

This document defines the comprehensive authorization rules for user registration and creation operations in the ReliaCare HIPAA-compliant, multi-tenant healthcare system. This covers both admin-initiated user creation and mobile app registrations.

## Role & User Type Mapping

| User Type ID | User Type Name | Primary Role   | Allowed Roles                                   |
| ------------ | -------------- | -------------- | ----------------------------------------------- |
| 1            | SYSTEM_ADMIN   | SUPER_ADMIN    | SUPER_ADMIN only                                |
| 2            | CLIENT_ADMIN   | CLIENT_ADMIN   | CLIENT_ADMIN only                               |
| 3            | CLINICAL_USER  | CLINICAL_STAFF | CLINICAL_STAFF or CLINICAL_STAFF + CLIENT_ADMIN |
| 4            | OFFICE_USER    | OFFICE_STAFF   | OFFICE_STAFF or OFFICE_STAFF + CLIENT_ADMIN     |
| 5            | PATIENT_USER   | PATIENT        | PATIENT only                                    |

## Registration Types

### Admin User Registration

- **Route**: `POST /api/v1/users/register`
- **Description**: Admin-initiated user creation with role assignment
- **Authorization**: Full validation of current user permissions vs target user type/roles

### Mobile App Registration

- **Route**: `POST /api/v1/users/register/mobile`
- **Description**: Public mobile app registration (typically PATIENT users)
- **Authorization**: Simplified validation with client verification

## User Registration Authorization Matrix

| **Current User Role**             | **Can Create**                                                                               | **Cannot Create**                                                           | **Restrictions**                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **SUPER_ADMIN**                   | ✅ CLIENT_ADMIN<br/>✅ CLINICAL_STAFF<br/>✅ OFFICE_STAFF<br/>✅ PATIENT<br/>✅ Hybrid roles | ❌ Other SUPER_ADMIN                                                        | • Cross-client creation allowed<br/>• Cannot create userTypeId = 1<br/>• All valid role combinations allowed |
| **CLIENT_ADMIN**                  | ✅ CLIENT_ADMIN<br/>✅ CLINICAL_STAFF<br/>✅ OFFICE_STAFF<br/>✅ PATIENT<br/>✅ Hybrid roles | ❌ SUPER_ADMIN                                                              | • Same client only<br/>• Cannot create userTypeId = 1<br/>• All other valid combinations allowed             |
| **CLINICAL_STAFF**                | ✅ PATIENT only                                                                              | ❌ All administrative roles<br/>❌ Other CLINICAL_STAFF<br/>❌ OFFICE_STAFF | • Same client only<br/>• Only userTypeId = 5<br/>• Only PATIENT role                                         |
| **CLINICAL_STAFF + CLIENT_ADMIN** | ✅ CLIENT_ADMIN<br/>✅ CLINICAL_STAFF<br/>✅ OFFICE_STAFF<br/>✅ PATIENT<br/>✅ Hybrid roles | ❌ SUPER_ADMIN                                                              | • Same client only<br/>• Cannot create userTypeId = 1<br/>• All other valid combinations allowed             |
| **OFFICE_STAFF**                  | ✅ PATIENT only                                                                              | ❌ All administrative roles<br/>❌ CLINICAL_STAFF<br/>❌ Other OFFICE_STAFF | • Same client only<br/>• Only userTypeId = 5<br/>• Only PATIENT role                                         |
| **OFFICE_STAFF + CLIENT_ADMIN**   | ✅ CLIENT_ADMIN<br/>✅ CLINICAL_STAFF<br/>✅ OFFICE_STAFF<br/>✅ PATIENT<br/>✅ Hybrid roles | ❌ SUPER_ADMIN                                                              | • Same client only<br/>• Cannot create userTypeId = 1<br/>• All other valid combinations allowed             |
| **PATIENT**                       | ❌ No one                                                                                    | ❌ All users                                                                | • No registration rights<br/>• Complete denial                                                               |

## Valid User Type & Role Combinations

### Single Role Assignments

| User Type ID | User Type Name | Required Role | Additional Roles Allowed |
| ------------ | -------------- | ------------- | ------------------------ |
| 1            | SYSTEM_ADMIN   | SUPER_ADMIN   | None                     |
| 2            | CLIENT_ADMIN   | CLIENT_ADMIN  | None                     |
| 5            | PATIENT_USER   | PATIENT       | None                     |

### Hybrid Role Assignments

| User Type ID | User Type Name | Primary Role   | Secondary Role          | Valid Combinations                                 |
| ------------ | -------------- | -------------- | ----------------------- | -------------------------------------------------- |
| 3            | CLINICAL_USER  | CLINICAL_STAFF | CLIENT_ADMIN (optional) | [CLINICAL_STAFF] or [CLINICAL_STAFF, CLIENT_ADMIN] |
| 4            | OFFICE_USER    | OFFICE_STAFF   | CLIENT_ADMIN (optional) | [OFFICE_STAFF] or [OFFICE_STAFF, CLIENT_ADMIN]     |

## Detailed Registration Rules by Current User Type

### 1. SUPER_ADMIN (userTypeId = 1)

**✅ CAN CREATE:**

- CLIENT_ADMIN users (userTypeId = 2) in any client
- CLINICAL_STAFF users (userTypeId = 3) in any client
- OFFICE_STAFF users (userTypeId = 4) in any client
- PATIENT users (userTypeId = 5) in any client
- Hybrid roles: CLINICAL_STAFF + CLIENT_ADMIN, OFFICE_STAFF + CLIENT_ADMIN

**❌ CANNOT CREATE:**

- Other SUPER_ADMIN users (userTypeId = 1) - business rule restriction

**🔒 RESTRICTIONS:**

- Cross-client creation allowed
- All valid role combinations permitted
- Cannot create SUPER_ADMIN accounts

### 2. CLIENT_ADMIN (userTypeId = 2)

**✅ CAN CREATE:**

- CLIENT_ADMIN users (userTypeId = 2) in same client
- CLINICAL_STAFF users (userTypeId = 3) in same client
- OFFICE_STAFF users (userTypeId = 4) in same client
- PATIENT users (userTypeId = 5) in same client
- Hybrid roles: CLINICAL_STAFF + CLIENT_ADMIN, OFFICE_STAFF + CLIENT_ADMIN

**❌ CANNOT CREATE:**

- SUPER_ADMIN users (userTypeId = 1) - authorization layer blocks
- Users in different clients

**🔒 RESTRICTIONS:**

- Same client only: actionClientId must equal reqClientId
- Cannot create SUPER_ADMIN accounts
- All other valid role combinations allowed

### 3. CLINICAL_STAFF (userTypeId = 3)

**✅ CAN CREATE:**

- PATIENT users (userTypeId = 5) with PATIENT role in same client

**❌ CANNOT CREATE:**

- SUPER_ADMIN users (userTypeId = 1)
- CLIENT_ADMIN users (userTypeId = 2)
- Other CLINICAL_STAFF users (userTypeId = 3)
- OFFICE_STAFF users (userTypeId = 4)
- Any hybrid role combinations
- Users in different clients

**🔒 RESTRICTIONS:**

- Same client only: actionClientId must equal reqClientId
- Only userTypeId = 5 (PATIENT accounts)
- Only single PATIENT role allowed

### 4. CLINICAL_STAFF + CLIENT_ADMIN (userTypeId = 3, hybrid roles)

**✅ CAN CREATE:**

- CLIENT_ADMIN users (userTypeId = 2) in same client
- CLINICAL_STAFF users (userTypeId = 3) in same client
- OFFICE_STAFF users (userTypeId = 4) in same client
- PATIENT users (userTypeId = 5) in same client
- Hybrid roles: CLINICAL_STAFF + CLIENT_ADMIN, OFFICE_STAFF + CLIENT_ADMIN

**❌ CANNOT CREATE:**

- SUPER_ADMIN users (userTypeId = 1) - authorization layer blocks
- Users in different clients

**🔒 RESTRICTIONS:**

- Same client only: actionClientId must equal reqClientId
- Cannot create SUPER_ADMIN accounts
- All other valid role combinations allowed (elevated privileges due to CLIENT_ADMIN role)

### 5. OFFICE_STAFF (userTypeId = 4)

**✅ CAN CREATE:**

- PATIENT users (userTypeId = 5) with PATIENT role in same client

**❌ CANNOT CREATE:**

- SUPER_ADMIN users (userTypeId = 1)
- CLIENT_ADMIN users (userTypeId = 2)
- CLINICAL_STAFF users (userTypeId = 3)
- Other OFFICE_STAFF users (userTypeId = 4)
- Any hybrid role combinations
- Users in different clients

**🔒 RESTRICTIONS:**

- Same client only: actionClientId must equal reqClientId
- Only userTypeId = 5 (PATIENT accounts)
- Only single PATIENT role allowed

### 6. OFFICE_STAFF + CLIENT_ADMIN (userTypeId = 4, hybrid roles)

**✅ CAN CREATE:**

- CLIENT_ADMIN users (userTypeId = 2) in same client
- CLINICAL_STAFF users (userTypeId = 3) in same client
- OFFICE_STAFF users (userTypeId = 4) in same client
- PATIENT users (userTypeId = 5) in same client
- Hybrid roles: CLINICAL_STAFF + CLIENT_ADMIN, OFFICE_STAFF + CLIENT_ADMIN

**❌ CANNOT CREATE:**

- SUPER_ADMIN users (userTypeId = 1) - authorization layer blocks
- Users in different clients

**🔒 RESTRICTIONS:**

- Same client only: actionClientId must equal reqClientId
- Cannot create SUPER_ADMIN accounts
- All other valid role combinations allowed (elevated privileges due to CLIENT_ADMIN role)

### 7. PATIENT (userTypeId = 5)

**✅ CAN CREATE:**

- No one

**❌ CANNOT CREATE:**

- All user types

**🔒 RESTRICTIONS:**

- Complete registration access denial
- No exceptions

## Multi-Layer Validation Process

### Step 1: User Type & Role Compatibility Validation

```typescript
function isValidUserTypeRoleCombination(userTypeId: number, roles: CoreRole[]): boolean {
  // Validates that the target user type and roles are compatible
  // Examples:
  // - userTypeId 1 must have only SUPER_ADMIN role
  // - userTypeId 3 can have CLINICAL_STAFF or [CLINICAL_STAFF, CLIENT_ADMIN]
  // - userTypeId 5 must have only PATIENT role
}
```

### Step 2: Current User Creation Authority Validation

```typescript
function canCurrentUserCreateTarget(
  currentUserTypeId: number,
  actionUserTypeId: number,
  actionUserRoles: CoreRole[],
  currentUserRoles: CoreRole[],
): boolean {
  // Validates if current user has authority to create target user type/roles
  // Considers hybrid roles and elevation scenarios
}
```

### Step 3: Client Boundary Validation

```typescript
function isClientAccessAllowed(
  currentUserTypeId: number,
  currentClientId: number | null,
  actionClientId: number | null,
): boolean {
  // Enforces multi-tenant isolation
  // SUPER_ADMIN can cross clients, others cannot
}
```

## Visual Permission Matrix

### User Creation Matrix

|                                   | **Create SUPER_ADMIN** | **Create CLIENT_ADMIN** | **Create CLINICAL_STAFF** | **Create OFFICE_STAFF** | **Create PATIENT** |
| --------------------------------- | ---------------------- | ----------------------- | ------------------------- | ----------------------- | ------------------ |
| **SUPER_ADMIN**                   | ❌ (Business Rule)     | ✅ (Any Client)         | ✅ (Any Client)           | ✅ (Any Client)         | ✅ (Any Client)    |
| **CLIENT_ADMIN**                  | ❌ (Auth Rule)         | ✅ (Same Client)        | ✅ (Same Client)          | ✅ (Same Client)        | ✅ (Same Client)   |
| **CLINICAL_STAFF**                | ❌ (Auth Rule)         | ❌ (Auth Rule)          | ❌ (Auth Rule)            | ❌ (Auth Rule)          | ✅ (Same Client)   |
| **CLINICAL_STAFF + CLIENT_ADMIN** | ❌ (Auth Rule)         | ✅ (Same Client)        | ✅ (Same Client)          | ✅ (Same Client)        | ✅ (Same Client)   |
| **OFFICE_STAFF**                  | ❌ (Auth Rule)         | ❌ (Auth Rule)          | ❌ (Auth Rule)            | ❌ (Auth Rule)          | ✅ (Same Client)   |
| **OFFICE_STAFF + CLIENT_ADMIN**   | ❌ (Auth Rule)         | ✅ (Same Client)        | ✅ (Same Client)          | ✅ (Same Client)        | ✅ (Same Client)   |
| **PATIENT**                       | ❌ (Auth Rule)         | ❌ (Auth Rule)          | ❌ (Auth Rule)            | ❌ (Auth Rule)          | ❌ (Auth Rule)     |

### Hybrid Role Creation Matrix

|                                   | **Create Hybrid Roles**   | **Cross-Client Creation** | **SUPER_ADMIN Creation** |
| --------------------------------- | ------------------------- | ------------------------- | ------------------------ |
| **SUPER_ADMIN**                   | ✅ All Valid Combinations | ✅ Yes                    | ❌ Business Rule         |
| **CLIENT_ADMIN**                  | ✅ All Valid Combinations | ❌ No                     | ❌ Auth Rule             |
| **CLINICAL_STAFF**                | ❌ No                     | ❌ No                     | ❌ Auth Rule             |
| **CLINICAL_STAFF + CLIENT_ADMIN** | ✅ All Valid Combinations | ❌ No                     | ❌ Auth Rule             |
| **OFFICE_STAFF**                  | ❌ No                     | ❌ No                     | ❌ Auth Rule             |
| **OFFICE_STAFF + CLIENT_ADMIN**   | ✅ All Valid Combinations | ❌ No                     | ❌ Auth Rule             |
| **PATIENT**                       | ❌ No                     | ❌ No                     | ❌ Auth Rule             |

## Implementation Details

### API Endpoints

```
POST /api/v1/users/register         (Admin Registration)
POST /api/v1/users/register/mobile  (Mobile Registration)
```

### Code Flow

1. **Route**: `/users/register` (routes.ts)
2. **Controller**: `registerUserController` (user.controller.ts)
3. **Service**: `registerUserService` (user.service.ts)
4. **Authorization**: `validateUserRegistrationAccess` (authorization.service.ts)
5. **Repository**: `createUserWithRoles` (user.repository.ts)

### Authorization Request Example

```typescript
// Authorization request for user registration
const oAuthReq: AuthRequest = createAuthRequest(
  currentUser,
  null, // No specific user ID for registration
  requestData.clientId, // Target client ID
  requestData.userTypeId, // Target user type
  requestData.roles, // Target user roles
  RequestUserAction.userAdd,
);
```

### Validation Examples

#### Valid Role Combinations

```typescript
// Valid combinations:
userTypeId: 1, roles: [SUPER_ADMIN]                           // ✅
userTypeId: 2, roles: [CLIENT_ADMIN]                          // ✅
userTypeId: 3, roles: [CLINICAL_STAFF]                        // ✅
userTypeId: 3, roles: [CLINICAL_STAFF, CLIENT_ADMIN]          // ✅
userTypeId: 4, roles: [OFFICE_STAFF]                          // ✅
userTypeId: 4, roles: [OFFICE_STAFF, CLIENT_ADMIN]            // ✅
userTypeId: 5, roles: [PATIENT]                               // ✅

// Invalid combinations:
userTypeId: 1, roles: [CLIENT_ADMIN]                          // ❌
userTypeId: 2, roles: [SUPER_ADMIN]                           // ❌
userTypeId: 3, roles: [OFFICE_STAFF]                          // ❌
userTypeId: 5, roles: [PATIENT, CLIENT_ADMIN]                 // ❌
```

#### Creation Authority Examples

```typescript
// SUPER_ADMIN creating CLIENT_ADMIN (any client)
currentUserTypeId: 1, actionUserTypeId: 2 → ✅

// CLIENT_ADMIN creating CLINICAL_STAFF (same client)
currentUserTypeId: 2, actionUserTypeId: 3 → ✅

// CLINICAL_STAFF creating PATIENT (same client)
currentUserTypeId: 3, actionUserTypeId: 5 → ✅

// CLINICAL_STAFF creating CLIENT_ADMIN (denied)
currentUserTypeId: 3, actionUserTypeId: 2 → ❌

// PATIENT creating anyone (denied)
currentUserTypeId: 5, actionUserTypeId: any → ❌
```

## Business Rules & Security Features

### Registration Business Rules

1. **No SUPER_ADMIN Creation**: Only system-level processes can create SUPER_ADMIN accounts
2. **Client Isolation**: Users can only create accounts within their own client (except SUPER_ADMIN)
3. **Role Hierarchy**: Users can only create accounts with equal or lower privilege levels
4. **Hybrid Role Support**: CLINICAL_STAFF and OFFICE_STAFF can have CLIENT_ADMIN elevation
5. **Email Validation**: Email domain validation for organizational compliance

### Security Features

- **Unique User Validation**: Prevents duplicate usernames and emails
- **Password Generation**: Secure temporary password generation
- **Role Assignment Validation**: Ensures proper role-to-user-type mapping
- **Client Boundary Enforcement**: Multi-tenant isolation
- **Comprehensive Audit Logging**: Full registration activity tracking

## Mobile App Registration

Mobile app registration follows simplified rules:

- Public endpoint for PATIENT user registration
- Client validation required
- Default PATIENT role assignment
- Simplified authorization flow
- Email verification integration

## Security Compliance

This authorization matrix ensures:

- **✅ Strict role hierarchy enforcement**
- **✅ Multi-tenant client isolation**
- **✅ HIPAA compliance for healthcare data**
- **✅ Principle of least privilege**
- **✅ Administrative oversight capabilities**
- **✅ Hybrid role support for operational flexibility**
- **✅ Comprehensive audit logging**
- **✅ Prevention of privilege escalation**

## Last Updated

June 24, 2025

## Related Documentation

- [User Deletion Authorization Matrix](./delete-user.md)
- [User View Authorization Matrix](./view-user.md)
- [User Update Authorization Matrix](./update-user.md)
