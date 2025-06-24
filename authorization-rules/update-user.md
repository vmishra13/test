# User Update/Edit Authorization Matrix

## Overview

This document defines the comprehensive authorization rules for user update and edit operations in the ReliaCare HIPAA-compliant, multi-tenant healthcare system. This covers profile updates, role changes, and administrative modifications to user accounts.

## Role & User Type Mapping

| User Type ID | User Type Name | Primary Role   | Allowed Roles                                   |
| ------------ | -------------- | -------------- | ----------------------------------------------- |
| 1            | SYSTEM_ADMIN   | SUPER_ADMIN    | SUPER_ADMIN only                                |
| 2            | CLIENT_ADMIN   | CLIENT_ADMIN   | CLIENT_ADMIN only                               |
| 3            | CLINICAL_USER  | CLINICAL_STAFF | CLINICAL_STAFF or CLINICAL_STAFF + CLIENT_ADMIN |
| 4            | OFFICE_USER    | OFFICE_STAFF   | OFFICE_STAFF or OFFICE_STAFF + CLIENT_ADMIN     |
| 5            | PATIENT_USER   | PATIENT        | PATIENT only                                    |

## Update Types

### Profile Updates

- **Route**: `PUT /api/v1/users/:userId`
- **Description**: Update user profile information (name, email, preferences, etc.)
- **Authorization**: Role-based access with client boundary enforcement

### Administrative Updates

- **Route**: `PUT /api/v1/users/:userId/admin`
- **Description**: Update user roles, status, permissions, or other administrative fields
- **Authorization**: Enhanced validation for role changes and system-level modifications

### Self-Profile Updates

- **Route**: `PUT /api/v1/users/profile`
- **Description**: Users updating their own profile information
- **Authorization**: Simplified validation for self-modification

## User Update Authorization Matrix

| **Current User Role**             | **Can Update**                                                                                                                                         | **Cannot Update**                                                                                   | **Restrictions**                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **SUPER_ADMIN**                   | ✅ Any user profile<br/>✅ Any user roles<br/>✅ Any user status<br/>✅ Cross-client users                                                             | ❌ Other SUPER_ADMIN core settings<br/>❌ System-level audit fields                                 | • Full access to all users<br/>• Can modify roles and permissions<br/>• Cross-client updates allowed        |
| **CLIENT_ADMIN**                  | ✅ CLIENT_ADMIN profiles<br/>✅ CLINICAL_STAFF profiles<br/>✅ OFFICE_STAFF profiles<br/>✅ PATIENT profiles<br/>✅ Role assignments (non-SUPER_ADMIN) | ❌ SUPER_ADMIN users<br/>❌ Users in other clients<br/>❌ System audit fields                       | • Same client only<br/>• Cannot update userTypeId = 1<br/>• Can modify roles except SUPER_ADMIN             |
| **CLINICAL_STAFF**                | ✅ PATIENT profiles only<br/>✅ PATIENT care-related fields<br/>✅ Medical notes and records                                                           | ❌ All administrative users<br/>❌ Other CLINICAL_STAFF<br/>❌ OFFICE_STAFF<br/>❌ Role assignments | • Same client only<br/>• Only userTypeId = 5<br/>• Only PATIENT role<br/>• Limited to clinical fields       |
| **CLINICAL_STAFF + CLIENT_ADMIN** | ✅ CLIENT_ADMIN profiles<br/>✅ CLINICAL_STAFF profiles<br/>✅ OFFICE_STAFF profiles<br/>✅ PATIENT profiles<br/>✅ Role assignments (non-SUPER_ADMIN) | ❌ SUPER_ADMIN users<br/>❌ Users in other clients<br/>❌ System audit fields                       | • Same client only<br/>• Cannot update userTypeId = 1<br/>• Full admin rights within client                 |
| **OFFICE_STAFF**                  | ✅ PATIENT profiles only<br/>✅ Administrative patient fields<br/>✅ Scheduling and billing data                                                       | ❌ All administrative users<br/>❌ CLINICAL_STAFF<br/>❌ Other OFFICE_STAFF<br/>❌ Role assignments | • Same client only<br/>• Only userTypeId = 5<br/>• Only PATIENT role<br/>• Limited to administrative fields |
| **OFFICE_STAFF + CLIENT_ADMIN**   | ✅ CLIENT_ADMIN profiles<br/>✅ CLINICAL_STAFF profiles<br/>✅ OFFICE_STAFF profiles<br/>✅ PATIENT profiles<br/>✅ Role assignments (non-SUPER_ADMIN) | ❌ SUPER_ADMIN users<br/>❌ Users in other clients<br/>❌ System audit fields                       | • Same client only<br/>• Cannot update userTypeId = 1<br/>• Full admin rights within client                 |
| **PATIENT**                       | ✅ Own profile only<br/>✅ Personal information<br/>✅ Preferences and settings                                                                        | ❌ All other users<br/>❌ Own role assignments<br/>❌ Administrative fields                         | • Self-update only<br/>• Cannot modify roles or permissions<br/>• Limited to personal data                  |

## Update Field Categories

### Personal Information Fields

- **Accessible by**: All roles (for appropriate target users)
- **Fields**: firstName, lastName, email, phone, address, dateOfBirth
- **Restrictions**: Email changes may require re-verification

### Medical Information Fields

- **Accessible by**: CLINICAL_STAFF, CLIENT_ADMIN, SUPER_ADMIN
- **Fields**: medicalHistory, allergies, medications, conditions
- **Restrictions**: HIPAA audit logging required

### Administrative Fields

- **Accessible by**: CLIENT_ADMIN, SUPER_ADMIN
- **Fields**: userTypeId, roles, status, permissions, clientId
- **Restrictions**: Role escalation rules apply

### System Fields

- **Accessible by**: SUPER_ADMIN only
- **Fields**: createdAt, updatedAt, lastLogin, securityEvents
- **Restrictions**: Read-only for most operations

## Business Rules

### Rule 1: Self-Update Rights

- **All users** can update their own basic profile information
- **Exception**: PATIENT users cannot modify their roles or administrative fields
- **Validation**: `actionUserId === reqUserId` for self-updates

### Rule 2: Client Boundary Enforcement

- **Non-SUPER_ADMIN users** cannot update users in different clients
- **Validation**: `actionClientId === reqClientId` (except SUPER_ADMIN)
- **Exception**: SUPER_ADMIN can update users across all clients

### Rule 3: Role Hierarchy Protection

- **Lower privilege roles** cannot update higher privilege users
- **CLINICAL_STAFF/OFFICE_STAFF** can only update PATIENT users
- **CLIENT_ADMIN** cannot update SUPER_ADMIN users

### Rule 4: Role Assignment Restrictions

- **Role changes** require appropriate permissions
- **Cannot grant higher roles** than current user possesses
- **SUPER_ADMIN role** can only be assigned by other SUPER_ADMIN users

### Rule 5: Field-Level Access Control

- **Medical fields** require clinical permissions
- **Administrative fields** require admin permissions
- **System fields** are protected from modification

## Audit and Compliance

### HIPAA Compliance

- **All user updates** are logged with full audit trail
- **Medical information changes** include additional HIPAA-specific logging
- **Access attempts** (both successful and failed) are recorded

### Security Events

- **Role changes** trigger security event logging
- **Permission escalations** are flagged for review
- **Cross-client access** by SUPER_ADMIN is logged

### Data Integrity

- **Field validation** ensures data consistency
- **Role validation** prevents invalid role combinations
- **Client validation** maintains multi-tenant isolation

## Error Handling

### Authorization Failures

```typescript
// Client boundary violation
❌ CLIENT_ADMIN cannot update users in a different client: 123 !== 456

// Role hierarchy violation
❌ CLINICAL_STAFF/OFFICE_STAFF can only update PATIENT accounts, attempted to update userTypeId: 2

// Self-update violation
❌ PATIENT can only update their own profile: 789 !== 456
```

### Validation Failures

```typescript
// Invalid role combination
❌ Cannot assign SUPER_ADMIN role without appropriate permissions

// Field access violation
❌ Insufficient permissions to update administrative fields

// System field protection
❌ System audit fields cannot be modified
```

## Implementation Notes

### Service Layer Integration

- **Authorization check** performed before business logic
- **Field-level validation** based on user permissions
- **Audit logging** integrated into update operations

### Database Considerations

- **Optimistic locking** to prevent concurrent update conflicts
- **Change tracking** for audit compliance
- **Field-level permissions** enforced at database level

### API Response Patterns

- **Success responses** include updated user data
- **Partial updates** supported with field-level validation
- **Error responses** provide specific authorization failure details

## Related Documentation

- [User Registration Authorization](./register-user.md)
- [User View Authorization](./view-user.md)
- [User Deletion Authorization](./delete-user.md)
- [HIPAA Compliance Guidelines](../docs/hipaa-compliance.md)
- [Multi-Tenant Security](../docs/multi-tenant-security.md)

---

**Last Updated**: June 24, 2025  
**Version**: 1.0  
**Status**: Active
