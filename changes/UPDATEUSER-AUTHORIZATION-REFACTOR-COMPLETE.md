# UpdateUser Function Refactoring: Following the Authorization Pattern

## Summary

Successfully refactored the `updateUser` function in `user.service.ts` to follow the same authorization pattern as `registerUser` and `getUsers`, ensuring consistent security enforcement across all user management operations.

## ✅ Changes Made

### 1. **Refactored updateUser Function**

- **File**: `c:\ReliaCare-backend\src\features\users\services\user.service.ts`
- **Pattern**: Now follows the same 7-step pattern as `registerUser` and `getUsers`

#### New Flow:

```typescript
export async function updateUser(req: ExtendedRequest<any> & { params: { userId: string } }): Promise<{ data: any; message: string }> {
  // 1. Check authentication
  const currentUser = getCurrentUser(req);

  // 2. Validate userId parameter
  const targetUserId = parseInt(userId);

  // 3. Get target user to build authorization context
  const targetUser = await userRepository.findUserById(targetUserId);

  // 4. Build authorization request
  const oAuthReq: AuthRequest = createAuthRequest(/*...*/, RequestUserAction.userEdit);

  // 5. Check authorization
  const hasPermission = performAuthorization(oAuthReq);

  // 6. Validate request body
  const validatedData = validateUpdateRequestBody(req.body);

  // 7. Perform user update
  return await performUserUpdate(targetUserId, validatedData, currentUser);
}
```

### 2. **Added Helper Functions**

#### **validateUpdateRequestBody()**

- Uses `UserUpdateInputSchema` from validators
- Validates main fields and `extraInfo` separately
- Consistent error handling with other services

#### **performUserUpdate()**

- Handles business logic for user updates
- Merges `extraInfo` with existing data
- Consistent response format
- Proper error handling

### 3. **Added Authorization Handler**

#### **validateUserEditAccess() in authorization.service.ts**

- **File**: `c:\ReliaCare-backend\src\features\auth\services\authorization.service.ts`
- Handles `RequestUserAction.userEdit` permission
- Enforces RBAC rules for user editing

#### Authorization Rules for User Editing:

- **SUPER_ADMIN**: Can edit any user
- **CLIENT_ADMIN**: Can edit users in their client (except SUPER_ADMIN)
- **CLINICAL_STAFF/OFFICE_STAFF**: Can only edit PATIENT users in their client
- **PATIENT**: Can only edit their own profile

### 4. **Updated performAuthorization Switch**

```typescript
case RequestUserAction.userEdit:
  return validateUserEditAccess(oAuthReq, currentUserRoles);
```

## 🎯 Pattern Consistency

### Before vs After Comparison

| Aspect             | Before (updateUser)    | After (updateUser)          | registerUser                   | getUsers                       |
| ------------------ | ---------------------- | --------------------------- | ------------------------------ | ------------------------------ |
| **Authentication** | ❌ `(req as any).user` | ✅ `getCurrentUser(req)`    | ✅ `getCurrentUser(req)`       | ✅ `getCurrentUser(req)`       |
| **Authorization**  | ❌ None                | ✅ `performAuthorization()` | ✅ `performAuthorization()`    | ✅ `performAuthorization()`    |
| **Validation**     | ⚠️ Manual + Zod        | ✅ Dedicated function       | ✅ `validateRequestBody()`     | ✅ `validateQueryParameters()` |
| **Business Logic** | ⚠️ Inline              | ✅ `performUserUpdate()`    | ✅ `performUserRegistration()` | ✅ `getUsersList()`            |
| **Error Handling** | ⚠️ Basic               | ✅ Consistent pattern       | ✅ Consistent pattern          | ✅ Consistent pattern          |

## 🔒 Security Improvements

### 1. **Multi-Tenant Isolation**

- Target user's client context is validated before update
- Cross-client updates are blocked (except for SUPER_ADMIN)

### 2. **Role-Based Access Control**

- Enforces hierarchy: SUPER_ADMIN > CLIENT_ADMIN > CLINICAL_STAFF/OFFICE_STAFF > PATIENT
- CLINICAL_STAFF/OFFICE_STAFF restricted to PATIENT users only
- PATIENT users can only edit themselves

### 3. **Authorization Context**

- Uses target user's actual client, user type, and roles for authorization
- Prevents privilege escalation attempts

## 📋 Authorization Matrix for User Updates

| Current User Role  | Can Update                      | Restrictions                 |
| ------------------ | ------------------------------- | ---------------------------- |
| **SUPER_ADMIN**    | ✅ Any user                     | None                         |
| **CLIENT_ADMIN**   | ✅ Users in same client         | ❌ Cannot update SUPER_ADMIN |
| **CLINICAL_STAFF** | ✅ PATIENT users in same client | ❌ Only PATIENT accounts     |
| **OFFICE_STAFF**   | ✅ PATIENT users in same client | ❌ Only PATIENT accounts     |
| **PATIENT**        | ✅ Own profile only             | ❌ Cannot update other users |

## 🔄 Flow Diagram

```
PUT /users/:userId Request
         ↓
   Authentication Check
         ↓
   Parameter Validation
         ↓
   Get Target User Context
         ↓
   Build Authorization Request
         ↓
   performAuthorization()
         ↓
   validateUserEditAccess()
         ↓
   Request Body Validation
         ↓
   performUserUpdate()
         ↓
   Database Update
         ↓
   Response
```

## 🧪 Testing Scenarios

### Test Cases to Verify:

1. **SUPER_ADMIN Updates**

   - ✅ Update any user in any client
   - ✅ Update SUPER_ADMIN users

2. **CLIENT_ADMIN Updates**

   - ✅ Update users in same client
   - ❌ Update users in different client
   - ❌ Update SUPER_ADMIN users

3. **CLINICAL_STAFF Updates**

   - ✅ Update PATIENT users in same client
   - ❌ Update non-PATIENT users
   - ❌ Update users in different client

4. **PATIENT Updates**
   - ✅ Update own profile
   - ❌ Update other users

## 🎉 Benefits Achieved

### 1. **Security Consistency**

- All three major user operations (register, view, update) now use the same security model
- Centralized authorization logic prevents security gaps

### 2. **Code Maintainability**

- Consistent patterns across all service functions
- Easy to understand and extend
- Reduced code duplication

### 3. **HIPAA/PHI Compliance**

- Strict multi-tenant isolation
- Role-based access controls
- Audit-friendly logging

### 4. **Developer Experience**

- Predictable patterns for new developers
- Clear separation of concerns
- Comprehensive error messages

## 🚀 Next Steps

1. **Apply Same Pattern to Other Operations**

   - `deleteUser()` - already partially implemented
   - `updateUserStatus()` - already partially implemented
   - `updateUserPassword()` - already partially implemented

2. **Testing**

   - Add unit tests for `validateUserEditAccess()`
   - Integration tests for the full update flow
   - Edge case testing for multi-role users

3. **Documentation**
   - Update API documentation with new authorization rules
   - Create developer guidelines for adding new user operations

## ✅ Verification

- ✅ No compilation errors
- ✅ Follows exact same pattern as `registerUser` and `getUsers`
- ✅ Consistent error handling and logging
- ✅ Proper TypeScript types and validation
- ✅ RBAC authorization implemented
- ✅ Multi-tenant security enforced
