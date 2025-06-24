# User View Authorization Matrix

## Overview

This document defines the comprehensive authorization rules for user viewing operations in the ReliaCare HIPAA-compliant, multi-tenant healthcare system. This includes both individual user profile viewing and user list access.

## Role & User Type Mapping

| User Type ID | User Type Name | Primary Role   | Allowed Roles                                   |
| ------------ | -------------- | -------------- | ----------------------------------------------- |
| 1            | SYSTEM_ADMIN   | SUPER_ADMIN    | SUPER_ADMIN only                                |
| 2            | CLIENT_ADMIN   | CLIENT_ADMIN   | CLIENT_ADMIN only                               |
| 3            | CLINICAL_USER  | CLINICAL_STAFF | CLINICAL_STAFF or CLINICAL_STAFF + CLIENT_ADMIN |
| 4            | OFFICE_USER    | OFFICE_STAFF   | OFFICE_STAFF or OFFICE_STAFF + CLIENT_ADMIN     |
| 5            | PATIENT_USER   | PATIENT        | PATIENT only                                    |

## View Access Types

### Individual User View

- **Route**: `GET /api/v1/users/:userId`
- **Description**: View a specific user's profile and details
- **Authorization Check**: Uses `actionUserId` to identify target user

### User List View

- **Route**: `GET /api/v1/users`
- **Description**: View paginated list of users with filtering
- **Authorization Check**: No specific `actionUserId` (list view)

## View Authorization Matrix

| **Current User Role** | **Individual User View**                            | **User List View**                                    | **Restrictions**                                                                        |
| --------------------- | --------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **SUPER_ADMIN**       | ✅ Any user profile<br/>✅ Cross-client access      | ✅ All users<br/>✅ Cross-client access               | • No restrictions<br/>• Full system access                                              |
| **CLIENT_ADMIN**      | ✅ Users in same client<br/>❌ SUPER_ADMIN profiles | ✅ Users in same client<br/>❌ SUPER_ADMIN in results | • Same client only<br/>• Cannot view userTypeId = 1<br/>• SUPER_ADMIN filtering applied |
| **CLINICAL_STAFF**    | ✅ PATIENT profiles only<br/>✅ Same client only    | ✅ PATIENT list only<br/>✅ Same client only          | • Only userTypeId = 5<br/>• Only PATIENT role<br/>• Service layer filters results       |
| **OFFICE_STAFF**      | ✅ PATIENT profiles only<br/>✅ Same client only    | ✅ PATIENT list only<br/>✅ Same client only          | • Only userTypeId = 5<br/>• Only PATIENT role<br/>• Service layer filters results       |
| **PATIENT**           | ✅ Own profile only                                 | ❌ No list access                                     | • Self-view only<br/>• No administrative access                                         |

## Detailed View Rules by Current User Type

### 1. SUPER_ADMIN (userTypeId = 1)

**✅ INDIVIDUAL USER VIEW:**

- Any user profile in any client
- SUPER_ADMIN users
- CLIENT_ADMIN users
- CLINICAL_STAFF users
- OFFICE_STAFF users
- PATIENT users

**✅ USER LIST VIEW:**

- All users across all clients
- No filtering restrictions
- Cross-client access allowed

**🔒 RESTRICTIONS:**

- None - full system access

### 2. CLIENT_ADMIN (userTypeId = 2)

**✅ INDIVIDUAL USER VIEW:**

- CLIENT_ADMIN users in same client
- CLINICAL_STAFF users in same client
- OFFICE_STAFF users in same client
- PATIENT users in same client

**❌ CANNOT VIEW (Individual):**

- SUPER_ADMIN users (userTypeId = 1) - authorization layer blocks
- Users in different clients
- Cross-client access denied

**✅ USER LIST VIEW:**

- Users in same client only
- SUPER_ADMIN users filtered out from results

**🔒 RESTRICTIONS:**

- Same client only: actionClientId must equal reqClientId
- Authorization layer prevents SUPER_ADMIN viewing
- Service layer filters SUPER_ADMIN from lists

### 3. CLINICAL_STAFF (userTypeId = 3)

**✅ INDIVIDUAL USER VIEW:**

- PATIENT users (userTypeId = 5) with PATIENT role in same client

**❌ CANNOT VIEW (Individual):**

- SUPER_ADMIN users (userTypeId = 1)
- CLIENT_ADMIN users (userTypeId = 2)
- Other CLINICAL_STAFF users (userTypeId = 3)
- OFFICE_STAFF users (userTypeId = 4)
- Users with non-PATIENT roles
- Users in different clients

**✅ USER LIST VIEW:**

- PATIENT users only in same client
- Service layer filters to PATIENT users automatically

**🔒 RESTRICTIONS:**

- Same client only: actionClientId must equal reqClientId
- Only userTypeId = 5 (PATIENT accounts)
- Target must have PATIENT role in their roles array
- Service layer applies additional PATIENT-only filtering

### 4. OFFICE_STAFF (userTypeId = 4)

**✅ INDIVIDUAL USER VIEW:**

- PATIENT users (userTypeId = 5) with PATIENT role in same client

**❌ CANNOT VIEW (Individual):**

- SUPER_ADMIN users (userTypeId = 1)
- CLIENT_ADMIN users (userTypeId = 2)
- CLINICAL_STAFF users (userTypeId = 3)
- Other OFFICE_STAFF users (userTypeId = 4)
- Users with non-PATIENT roles
- Users in different clients

**✅ USER LIST VIEW:**

- PATIENT users only in same client
- Service layer filters to PATIENT users automatically

**🔒 RESTRICTIONS:**

- Same client only: actionClientId must equal reqClientId
- Only userTypeId = 5 (PATIENT accounts)
- Target must have PATIENT role in their roles array
- Service layer applies additional PATIENT-only filtering

### 5. PATIENT (userTypeId = 5)

**✅ INDIVIDUAL USER VIEW:**

- Own profile only (actionUserId must equal reqUserId)

**❌ CANNOT VIEW:**

- Any other user profiles
- Any administrative accounts

**❌ USER LIST VIEW:**

- Complete list access denial
- No user browsing capabilities

**🔒 RESTRICTIONS:**

- Self-view only for individual profiles
- No list access for security and privacy
- Cannot view other patients or staff

## Multi-Layer Security Protection

### Authorization Layer (authorization.service.ts)

- Role-based permission matrix
- Client boundary enforcement
- User type validation
- Role validation
- List vs individual view differentiation

### Service Layer (user.service.ts)

- Additional result filtering
- PATIENT-only result sets for CLINICAL/OFFICE staff
- SUPER_ADMIN exclusion for CLIENT_ADMIN
- Client isolation enforcement

### Business Rules Summary

**Authorization Layer Rules:**

1. SUPER_ADMIN: Can view any user/list across all clients
2. CLIENT_ADMIN: Can view users in same client (excluding SUPER_ADMIN)
3. CLINICAL_STAFF: Can view PATIENT users only in same client
4. OFFICE_STAFF: Can view PATIENT users only in same client
5. PATIENT: Can view own profile only, no list access

**Service Layer Rules:**

1. Client isolation enforcement
2. Role-based result filtering
3. PATIENT-only filtering for staff roles
4. SUPER_ADMIN exclusion for non-SUPER_ADMIN users
5. Comprehensive audit logging

## Visual Permission Matrix

### Individual User View Matrix

|                    | **View SUPER_ADMIN** | **View CLIENT_ADMIN** | **View CLINICAL_STAFF** | **View OFFICE_STAFF** | **View PATIENT** |
| ------------------ | -------------------- | --------------------- | ----------------------- | --------------------- | ---------------- |
| **SUPER_ADMIN**    | ✅                   | ✅                    | ✅                      | ✅                    | ✅               |
| **CLIENT_ADMIN**   | ❌ (Auth Rule)       | ✅ (Same Client)      | ✅ (Same Client)        | ✅ (Same Client)      | ✅ (Same Client) |
| **CLINICAL_STAFF** | ❌ (Auth Rule)       | ❌ (Auth Rule)        | ❌ (Auth Rule)          | ❌ (Auth Rule)        | ✅ (Same Client) |
| **OFFICE_STAFF**   | ❌ (Auth Rule)       | ❌ (Auth Rule)        | ❌ (Auth Rule)          | ❌ (Auth Rule)        | ✅ (Same Client) |
| **PATIENT**        | ❌ (Auth Rule)       | ❌ (Auth Rule)        | ❌ (Auth Rule)          | ❌ (Auth Rule)        | ✅ (Self Only)   |

### User List View Matrix

|                    | **View User Lists** | **Cross-Client Access** | **Filtered Results**   |
| ------------------ | ------------------- | ----------------------- | ---------------------- |
| **SUPER_ADMIN**    | ✅ All Users        | ✅ Yes                  | ❌ No Filtering        |
| **CLIENT_ADMIN**   | ✅ Same Client      | ❌ No                   | ✅ Exclude SUPER_ADMIN |
| **CLINICAL_STAFF** | ✅ Same Client      | ❌ No                   | ✅ PATIENT Users Only  |
| **OFFICE_STAFF**   | ✅ Same Client      | ❌ No                   | ✅ PATIENT Users Only  |
| **PATIENT**        | ❌ No Access        | ❌ No                   | ❌ N/A                 |

## Implementation Details

### API Endpoints

```
GET /api/v1/users/:userId  (Individual View)
GET /api/v1/users          (List View)
```

### Code Flow

1. **Route**: `/users/:userId` or `/users` (routes.ts)
2. **Controller**: `getUserByIdController` or `getUsersController` (user.controller.ts)
3. **Service**: `getUserByIdService` or `getUsersService` (user.service.ts)
4. **Authorization**: `validateUserViewAccess` (authorization.service.ts)
5. **Repository**: `findUserById` or `getUsersList` (user.repository.ts)

### View Type Detection

```typescript
const isListView = !oAuthReq.actionUserId; // No specific user ID
const isIndividualView = !!oAuthReq.actionUserId; // Specific user ID provided
```

### Authorization Examples

#### Individual User View

```typescript
// Authorization request for viewing specific user
const oAuthReq: AuthRequest = createAuthRequest(
  currentUser,
  targetUserId, // Specific user ID to view
  targetUser.clientId, // Target user's client
  targetUser.userTypeId, // Target user's type
  targetUserRoles, // Target user's roles
  RequestUserAction.userView,
);
```

#### User List View

```typescript
// Authorization request for user list
const oAuthReq: AuthRequest = createAuthRequest(
  currentUser,
  null, // No specific user ID (list view)
  queryParams.clientId, // Client ID from query or current user's client
  null, // No specific user type
  queryParams.role, // Role filter from query
  RequestUserAction.userView,
);
```

### Business Rule Examples

#### CLIENT_ADMIN Restrictions

```typescript
// For individual user view, check if target user has SUPER_ADMIN role
if (isIndividualView) {
  if (targetUserRoles.includes(CoreRole.SUPER_ADMIN) || oAuthReq.actionUserTypeId === 1) {
    logger.error(`❌ CLIENT_ADMIN cannot view SUPER_ADMIN users`);
    return false;
  }
}
```

#### CLINICAL/OFFICE_STAFF Restrictions

```typescript
// CRITICAL: They can ONLY view PATIENT accounts (userTypeId = 5)
if (oAuthReq.actionUserTypeId && oAuthReq.actionUserTypeId !== 5) {
  logger.error(
    `❌ CLINICAL_STAFF/OFFICE_STAFF can only view PATIENT accounts, attempted to view userTypeId: ${oAuthReq.actionUserTypeId}`,
  );
  return false;
}

// Also check roles - must have PATIENT role
if (targetUserRoles.length > 0 && !targetUserRoles.includes(CoreRole.PATIENT)) {
  logger.error(`❌ CLINICAL_STAFF/OFFICE_STAFF can only view users with PATIENT role`);
  return false;
}
```

#### PATIENT Self-View Only

```typescript
// For individual view, patients can only view themselves
if (isIndividualView) {
  if (oAuthReq.actionUserId !== oAuthReq.reqUserId) {
    logger.error(
      `❌ PATIENT can only view their own profile: ${oAuthReq.actionUserId} !== ${oAuthReq.reqUserId}`,
    );
    return false;
  }
  return true;
}
```

## Security Compliance

This authorization matrix ensures:

- **✅ Strict role hierarchy enforcement**
- **✅ Multi-tenant client isolation**
- **✅ HIPAA compliance for healthcare data**
- **✅ Patient privacy protection**
- **✅ Principle of least privilege**
- **✅ Administrative oversight capabilities**
- **✅ Comprehensive audit logging**
- **✅ Prevention of unauthorized data access**

## Privacy and Security Features

### Patient Protection

- PATIENT users can only view their own profiles
- No list access for PATIENT users prevents patient enumeration
- CLINICAL/OFFICE staff limited to PATIENT user viewing only

### Administrative Oversight

- CLIENT_ADMIN can oversee all users in their organization
- SUPER_ADMIN maintains system-wide visibility
- Clear audit trail for all view operations

### Data Segregation

- Client-based data isolation
- Role-based access control
- User type validation
- Cross-client access prevention (except SUPER_ADMIN)

## Last Updated

June 24, 2025

## Related Documentation

- [User Deletion Authorization Matrix](./delete-user.md)
- [User Registration Authorization Matrix](./register-user.md)
- [User Update Authorization Matrix](./update-user.md)
