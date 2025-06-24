# User Deletion Authorization Matrix

## Overview

This document defines the comprehensive authorization rules for user deletion operations in the ReliaCare HIPAA-compliant, multi-tenant healthcare system.

## Role & User Type Mapping

| User Type ID | User Type Name | Primary Role   | Allowed Roles                                   |
| ------------ | -------------- | -------------- | ----------------------------------------------- |
| 1            | SYSTEM_ADMIN   | SUPER_ADMIN    | SUPER_ADMIN only                                |
| 2            | CLIENT_ADMIN   | CLIENT_ADMIN   | CLIENT_ADMIN only                               |
| 3            | CLINICAL_USER  | CLINICAL_STAFF | CLINICAL_STAFF or CLINICAL_STAFF + CLIENT_ADMIN |
| 4            | OFFICE_USER    | OFFICE_STAFF   | OFFICE_STAFF or OFFICE_STAFF + CLIENT_ADMIN     |
| 5            | PATIENT_USER   | PATIENT        | PATIENT only                                    |

## Deletion Authorization Matrix

| **Current User Role** | **Can Delete**                                                           | **Cannot Delete**                                                                              | **Restrictions**                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **SUPER_ADMIN**       | ✅ CLIENT_ADMIN<br/>✅ CLINICAL_STAFF<br/>✅ OFFICE_STAFF<br/>✅ PATIENT | ❌ Other SUPER_ADMIN<br/>❌ Self                                                               | • Cross-client access allowed<br/>• Service layer prevents SUPER_ADMIN deletion<br/>• Service layer prevents self-deletion          |
| **CLIENT_ADMIN**      | ✅ CLINICAL_STAFF<br/>✅ OFFICE_STAFF<br/>✅ PATIENT                     | ❌ SUPER_ADMIN<br/>❌ Other CLIENT_ADMIN<br/>❌ Self                                           | • Same client only<br/>• Cannot delete userTypeId = 1<br/>• Cannot delete userTypeId = 2<br/>• Service layer prevents self-deletion |
| **CLINICAL_STAFF**    | ✅ PATIENT                                                               | ❌ SUPER_ADMIN<br/>❌ CLIENT_ADMIN<br/>❌ Other CLINICAL_STAFF<br/>❌ OFFICE_STAFF<br/>❌ Self | • Same client only<br/>• Only userTypeId = 5<br/>• Only PATIENT role<br/>• Service layer prevents self-deletion                     |
| **OFFICE_STAFF**      | ✅ PATIENT                                                               | ❌ SUPER_ADMIN<br/>❌ CLIENT_ADMIN<br/>❌ CLINICAL_STAFF<br/>❌ Other OFFICE_STAFF<br/>❌ Self | • Same client only<br/>• Only userTypeId = 5<br/>• Only PATIENT role<br/>• Service layer prevents self-deletion                     |
| **PATIENT**           | ❌ No one                                                                | ❌ All users<br/>❌ Self                                                                       | • No deletion rights at all<br/>• Security measure                                                                                  |

## Detailed Deletion Rules by Current User Type

### 1. SUPER_ADMIN (userTypeId = 1)

**✅ CAN DELETE:**

- CLIENT_ADMIN users (userTypeId = 2) in any client
- CLINICAL_STAFF users (userTypeId = 3) in any client
- OFFICE_STAFF users (userTypeId = 4) in any client
- PATIENT users (userTypeId = 5) in any client

**❌ CANNOT DELETE:**

- Other SUPER_ADMIN users (service layer business rule)
- Self (service layer business rule)

**🔒 RESTRICTIONS:**

- Cross-client access allowed
- Service layer enforces SUPER_ADMIN protection

### 2. CLIENT_ADMIN (userTypeId = 2)

**✅ CAN DELETE:**

- CLINICAL_STAFF users (userTypeId = 3) in same client
- OFFICE_STAFF users (userTypeId = 4) in same client
- PATIENT users (userTypeId = 5) in same client

**❌ CANNOT DELETE:**

- SUPER_ADMIN users (userTypeId = 1) - authorization layer blocks
- Other CLIENT_ADMIN users (userTypeId = 2) - authorization layer blocks
- Users in different clients
- Self (service layer business rule)

**🔒 RESTRICTIONS:**

- Same client only: actionClientId must equal reqClientId
- Authorization layer prevents SUPER_ADMIN deletion
- Authorization layer prevents CLIENT_ADMIN deletion

### 3. CLINICAL_STAFF (userTypeId = 3)

**✅ CAN DELETE:**

- PATIENT users (userTypeId = 5) with PATIENT role in same client

**❌ CANNOT DELETE:**

- SUPER_ADMIN users (userTypeId = 1)
- CLIENT_ADMIN users (userTypeId = 2)
- Other CLINICAL_STAFF users (userTypeId = 3)
- OFFICE_STAFF users (userTypeId = 4)
- Users with non-PATIENT roles
- Users in different clients
- Self (service layer business rule)

**🔒 RESTRICTIONS:**

- Same client only: actionClientId must equal reqClientId
- Only userTypeId = 5 (PATIENT accounts)
- Target must have PATIENT role in their roles array

### 4. OFFICE_STAFF (userTypeId = 4)

**✅ CAN DELETE:**

- PATIENT users (userTypeId = 5) with PATIENT role in same client

**❌ CANNOT DELETE:**

- SUPER_ADMIN users (userTypeId = 1)
- CLIENT_ADMIN users (userTypeId = 2)
- CLINICAL_STAFF users (userTypeId = 3)
- Other OFFICE_STAFF users (userTypeId = 4)
- Users with non-PATIENT roles
- Users in different clients
- Self (service layer business rule)

**🔒 RESTRICTIONS:**

- Same client only: actionClientId must equal reqClientId
- Only userTypeId = 5 (PATIENT accounts)
- Target must have PATIENT role in their roles array

### 5. PATIENT (userTypeId = 5)

**✅ CAN DELETE:**

- No one

**❌ CANNOT DELETE:**

- All users (including self)

**🔒 RESTRICTIONS:**

- Complete deletion access denial for security
- No exceptions

## Multi-Layer Security Protection

### Authorization Layer (authorization.service.ts)

- Role-based permission matrix
- Client boundary enforcement
- User type validation
- Role validation

### Service Layer (user.service.ts)

- SUPER_ADMIN deletion prevention
- CLIENT_ADMIN cross-deletion prevention
- Self-deletion prevention
- Active dependency checks (TODO)

### Business Rules Summary

**Authorization Layer Rules:**

1. SUPER_ADMIN: Can delete anyone (service layer applies restrictions)
2. CLIENT_ADMIN: Can delete non-admin users in same client
3. CLINICAL_STAFF: Can delete PATIENT users only in same client
4. OFFICE_STAFF: Can delete PATIENT users only in same client
5. PATIENT: Cannot delete anyone

**Service Layer Rules:**

1. No SUPER_ADMIN deletion
2. No CLIENT_ADMIN cross-deletion
3. No self-deletion
4. Client isolation enforcement
5. Audit logging for all deletions

## Visual Permission Matrix

|                    | **Delete SUPER_ADMIN** | **Delete CLIENT_ADMIN** | **Delete CLINICAL_STAFF** | **Delete OFFICE_STAFF** | **Delete PATIENT** |
| ------------------ | ---------------------- | ----------------------- | ------------------------- | ----------------------- | ------------------ |
| **SUPER_ADMIN**    | ❌ (Service Rule)      | ✅                      | ✅                        | ✅                      | ✅                 |
| **CLIENT_ADMIN**   | ❌ (Auth Rule)         | ❌ (Auth Rule)          | ✅ (Same Client)          | ✅ (Same Client)        | ✅ (Same Client)   |
| **CLINICAL_STAFF** | ❌ (Auth Rule)         | ❌ (Auth Rule)          | ❌ (Auth Rule)            | ❌ (Auth Rule)          | ✅ (Same Client)   |
| **OFFICE_STAFF**   | ❌ (Auth Rule)         | ❌ (Auth Rule)          | ❌ (Auth Rule)            | ❌ (Auth Rule)          | ✅ (Same Client)   |
| **PATIENT**        | ❌ (Auth Rule)         | ❌ (Auth Rule)          | ❌ (Auth Rule)            | ❌ (Auth Rule)          | ❌ (Auth Rule)     |

## Implementation Details

### API Endpoint

```
DELETE /api/v1/users/:userId
```

### Code Flow

1. **Route**: `/users/:userId` (routes.ts)
2. **Controller**: `deleteUserController` (user.controller.ts)
3. **Service**: `deleteUserService` (user.service.ts)
4. **Authorization**: `validateUserDeleteAccess` (authorization.service.ts)
5. **Repository**: `softDeleteUser` (user.repository.ts)

### Example Authorization Check

```typescript
// Authorization request building
const oAuthReq: AuthRequest = createAuthRequest(
  currentUser,
  actionUserId, // Target user ID
  actionClientId, // Target user's client
  actionUserTypeId, // Target user's type
  actionUserRoles, // Target user's roles
  RequestUserAction.userDelete,
);

// Permission validation
const hasPermission = performAuthorization(oAuthReq);
```

### Business Rule Enforcement

```typescript
// Service layer additional checks
if (targetUserRoles.includes(CoreRole.SUPER_ADMIN)) {
  throw createAuthorizationError('SUPER_ADMIN users cannot be deleted');
}

if (currentUserRole === CoreRole.CLIENT_ADMIN && targetUserRoles.includes(CoreRole.CLIENT_ADMIN)) {
  throw createAuthorizationError('CLIENT_ADMIN cannot delete other CLIENT_ADMIN users');
}

if (targetUserId === currentUser.userId) {
  throw createAuthorizationError('Users cannot delete themselves');
}
```

## Security Compliance

This authorization matrix ensures:

- **✅ Strict role hierarchy enforcement**
- **✅ Multi-tenant client isolation**
- **✅ HIPAA compliance for healthcare data**
- **✅ Administrative flexibility for legitimate operations**
- **✅ Comprehensive audit logging**
- **✅ Prevention of privilege escalation**
- **✅ Protection against accidental or malicious deletions**

## Last Updated

June 24, 2025

## Related Documentation

- [User Registration Authorization Matrix](./register-user.md)
- [User Update Authorization Matrix](./update-user.md)
- [User View Authorization Matrix](./view-user.md)
