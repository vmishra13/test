## 📊 **Complete User Registration Authorization Matrix**

### **🎯 Current User Capabilities (Updated)**

| Current User Type     | Current User Roles              | Can Register User Types | Can Register Roles                                                                                                               | Client Restrictions     |
| --------------------- | ------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **1 (SYSTEM_ADMIN)**  | [SUPER_ADMIN]                   | 1, 2, 3, 4, 5           | SUPER_ADMIN, CLIENT_ADMIN, CLINICAL_STAFF, OFFICE_STAFF, PATIENT, [CLINICAL_STAFF + CLIENT_ADMIN], [OFFICE_STAFF + CLIENT_ADMIN] | ✅ **Any Client**       |
| **2 (CLIENT_ADMIN)**  | [CLIENT_ADMIN]                  | 2, 3, 4, 5              | CLIENT_ADMIN, CLINICAL_STAFF, OFFICE_STAFF, PATIENT, [CLINICAL_STAFF + CLIENT_ADMIN], [OFFICE_STAFF + CLIENT_ADMIN]              | ⚠️ **Same Client Only** |
| **3 (CLINICAL_USER)** | [CLINICAL_STAFF]                | 5                       | [PATIENT]                                                                                                                        | ⚠️ **Same Client Only** |
| **3 (CLINICAL_USER)** | [CLINICAL_STAFF + CLIENT_ADMIN] | 2, 3, 4, 5              | CLIENT_ADMIN, CLINICAL_STAFF, OFFICE_STAFF, PATIENT, [CLINICAL_STAFF + CLIENT_ADMIN], [OFFICE_STAFF + CLIENT_ADMIN]              | ⚠️ **Same Client Only** |
| **4 (OFFICE_USER)**   | [OFFICE_STAFF]                  | 5                       | [PATIENT]                                                                                                                        | ⚠️ **Same Client Only** |
| **4 (OFFICE_USER)**   | [OFFICE_STAFF + CLIENT_ADMIN]   | 2, 3, 4, 5              | CLIENT_ADMIN, CLINICAL_STAFF, OFFICE_STAFF, PATIENT, [CLINICAL_STAFF + CLIENT_ADMIN], [OFFICE_STAFF + CLIENT_ADMIN]              | ⚠️ **Same Client Only** |
| **5 (PATIENT_USER)**  | [PATIENT]                       | ❌ None                 | ❌ None                                                                                                                          | ❌ **No Access**        |

### **🔒 Target User Type-Role Validation Rules**

| Target User Type ID | Target User Type Name | Valid Role Combinations                                    |
| ------------------- | --------------------- | ---------------------------------------------------------- |
| **1**               | SYSTEM_ADMIN          | `[SUPER_ADMIN]`                                            |
| **2**               | CLIENT_ADMIN          | `[CLIENT_ADMIN]`                                           |
| **3**               | CLINICAL_USER         | `[CLINICAL_STAFF]` **OR** `[CLINICAL_STAFF, CLIENT_ADMIN]` |
| **4**               | OFFICE_USER           | `[OFFICE_STAFF]` **OR** `[OFFICE_STAFF, CLIENT_ADMIN]`     |
| **5**               | PATIENT_USER          | `[PATIENT]`                                                |

### **📋 Detailed Authorization Scenarios**

#### **✅ SUCCESS SCENARIOS**

| Current User                          | Target User Type | Target Roles                   | Client Context | Result     | Reason                                  |
| ------------------------------------- | ---------------- | ------------------------------ | -------------- | ---------- | --------------------------------------- |
| Type 1 [SUPER_ADMIN]                  | Type 1           | [SUPER_ADMIN]                  | Any Client     | ✅ ALLOWED | SUPER_ADMIN can create anyone           |
| Type 1 [SUPER_ADMIN]                  | Type 2           | [CLIENT_ADMIN]                 | Any Client     | ✅ ALLOWED | SUPER_ADMIN can create anyone           |
| Type 1 [SUPER_ADMIN]                  | Type 3           | [CLINICAL_STAFF]               | Any Client     | ✅ ALLOWED | SUPER_ADMIN can create anyone           |
| Type 1 [SUPER_ADMIN]                  | Type 3           | [CLINICAL_STAFF, CLIENT_ADMIN] | Any Client     | ✅ ALLOWED | SUPER_ADMIN can create anyone           |
| Type 1 [SUPER_ADMIN]                  | Type 4           | [OFFICE_STAFF]                 | Any Client     | ✅ ALLOWED | SUPER_ADMIN can create anyone           |
| Type 1 [SUPER_ADMIN]                  | Type 4           | [OFFICE_STAFF, CLIENT_ADMIN]   | Any Client     | ✅ ALLOWED | SUPER_ADMIN can create anyone           |
| Type 1 [SUPER_ADMIN]                  | Type 5           | [PATIENT]                      | Any Client     | ✅ ALLOWED | SUPER_ADMIN can create anyone           |
| Type 2 [CLIENT_ADMIN]                 | Type 2           | [CLIENT_ADMIN]                 | Same Client    | ✅ ALLOWED | CLIENT_ADMIN can create non-SUPER_ADMIN |
| Type 2 [CLIENT_ADMIN]                 | Type 3           | [CLINICAL_STAFF]               | Same Client    | ✅ ALLOWED | CLIENT_ADMIN can create non-SUPER_ADMIN |
| Type 2 [CLIENT_ADMIN]                 | Type 3           | [CLINICAL_STAFF, CLIENT_ADMIN] | Same Client    | ✅ ALLOWED | CLIENT_ADMIN can create non-SUPER_ADMIN |
| Type 2 [CLIENT_ADMIN]                 | Type 4           | [OFFICE_STAFF]                 | Same Client    | ✅ ALLOWED | CLIENT_ADMIN can create non-SUPER_ADMIN |
| Type 2 [CLIENT_ADMIN]                 | Type 4           | [OFFICE_STAFF, CLIENT_ADMIN]   | Same Client    | ✅ ALLOWED | CLIENT_ADMIN can create non-SUPER_ADMIN |
| Type 2 [CLIENT_ADMIN]                 | Type 5           | [PATIENT]                      | Same Client    | ✅ ALLOWED | CLIENT_ADMIN can create non-SUPER_ADMIN |
| Type 3 [CLINICAL_STAFF]               | Type 5           | [PATIENT]                      | Same Client    | ✅ ALLOWED | CLINICAL_STAFF can create PATIENT only  |
| Type 3 [CLINICAL_STAFF, CLIENT_ADMIN] | Type 2           | [CLIENT_ADMIN]                 | Same Client    | ✅ ALLOWED | **Has CLIENT_ADMIN role privileges**    |
| Type 3 [CLINICAL_STAFF, CLIENT_ADMIN] | Type 3           | [CLINICAL_STAFF]               | Same Client    | ✅ ALLOWED | **Has CLIENT_ADMIN role privileges**    |
| Type 3 [CLINICAL_STAFF, CLIENT_ADMIN] | Type 3           | [CLINICAL_STAFF, CLIENT_ADMIN] | Same Client    | ✅ ALLOWED | **Has CLIENT_ADMIN role privileges**    |
| Type 3 [CLINICAL_STAFF, CLIENT_ADMIN] | Type 4           | [OFFICE_STAFF]                 | Same Client    | ✅ ALLOWED | **Has CLIENT_ADMIN role privileges**    |
| Type 3 [CLINICAL_STAFF, CLIENT_ADMIN] | Type 4           | [OFFICE_STAFF, CLIENT_ADMIN]   | Same Client    | ✅ ALLOWED | **Has CLIENT_ADMIN role privileges**    |
| Type 3 [CLINICAL_STAFF, CLIENT_ADMIN] | Type 5           | [PATIENT]                      | Same Client    | ✅ ALLOWED | **Has CLIENT_ADMIN role privileges**    |
| Type 4 [OFFICE_STAFF]                 | Type 5           | [PATIENT]                      | Same Client    | ✅ ALLOWED | OFFICE_STAFF can create PATIENT only    |
| Type 4 [OFFICE_STAFF, CLIENT_ADMIN]   | Type 2           | [CLIENT_ADMIN]                 | Same Client    | ✅ ALLOWED | **Has CLIENT_ADMIN role privileges**    |
| Type 4 [OFFICE_STAFF, CLIENT_ADMIN]   | Type 3           | [CLINICAL_STAFF]               | Same Client    | ✅ ALLOWED | **Has CLIENT_ADMIN role privileges**    |
| Type 4 [OFFICE_STAFF, CLIENT_ADMIN]   | Type 3           | [CLINICAL_STAFF, CLIENT_ADMIN] | Same Client    | ✅ ALLOWED | **Has CLIENT_ADMIN role privileges**    |
| Type 4 [OFFICE_STAFF, CLIENT_ADMIN]   | Type 4           | [OFFICE_STAFF]                 | Same Client    | ✅ ALLOWED | **Has CLIENT_ADMIN role privileges**    |
| Type 4 [OFFICE_STAFF, CLIENT_ADMIN]   | Type 4           | [OFFICE_STAFF, CLIENT_ADMIN]   | Same Client    | ✅ ALLOWED | **Has CLIENT_ADMIN role privileges**    |
| Type 4 [OFFICE_STAFF, CLIENT_ADMIN]   | Type 5           | [PATIENT]                      | Same Client    | ✅ ALLOWED | **Has CLIENT_ADMIN role privileges**    |

#### **❌ FAILURE SCENARIOS**

| Current User                          | Target User Type | Target Roles     | Client Context   | Result         | Reason                                                  |
| ------------------------------------- | ---------------- | ---------------- | ---------------- | -------------- | ------------------------------------------------------- |
| Type 2 [CLIENT_ADMIN]                 | Type 1           | [SUPER_ADMIN]    | Any Client       | ❌ FORBIDDEN   | Cannot create SUPER_ADMIN                               |
| Type 2 [CLIENT_ADMIN]                 | Any Type         | Any Roles        | Different Client | ❌ FORBIDDEN   | CLIENT_ADMIN restricted to same client                  |
| Type 3 [CLINICAL_STAFF]               | Type 1           | [SUPER_ADMIN]    | Any Client       | ❌ FORBIDDEN   | Can only create PATIENT                                 |
| Type 3 [CLINICAL_STAFF]               | Type 2           | [CLIENT_ADMIN]   | Any Client       | ❌ FORBIDDEN   | Can only create PATIENT                                 |
| Type 3 [CLINICAL_STAFF]               | Type 3           | [CLINICAL_STAFF] | Any Client       | ❌ FORBIDDEN   | Can only create PATIENT                                 |
| Type 3 [CLINICAL_STAFF]               | Type 4           | [OFFICE_STAFF]   | Any Client       | ❌ FORBIDDEN   | Can only create PATIENT                                 |
| Type 3 [CLINICAL_STAFF]               | Type 5           | [PATIENT]        | Different Client | ❌ FORBIDDEN   | Restricted to same client                               |
| Type 3 [CLINICAL_STAFF, CLIENT_ADMIN] | Type 1           | [SUPER_ADMIN]    | Any Client       | ❌ FORBIDDEN   | Cannot create SUPER_ADMIN (even with CLIENT_ADMIN role) |
| Type 3 [CLINICAL_STAFF, CLIENT_ADMIN] | Any Type         | Any Roles        | Different Client | ❌ FORBIDDEN   | Restricted to same client                               |
| Type 4 [OFFICE_STAFF]                 | Type 1           | [SUPER_ADMIN]    | Any Client       | ❌ FORBIDDEN   | Can only create PATIENT                                 |
| Type 4 [OFFICE_STAFF]                 | Type 2           | [CLIENT_ADMIN]   | Any Client       | ❌ FORBIDDEN   | Can only create PATIENT                                 |
| Type 4 [OFFICE_STAFF]                 | Type 3           | [CLINICAL_STAFF] | Any Client       | ❌ FORBIDDEN   | Can only create PATIENT                                 |
| Type 4 [OFFICE_STAFF]                 | Type 4           | [OFFICE_STAFF]   | Any Client       | ❌ FORBIDDEN   | Can only create PATIENT                                 |
| Type 4 [OFFICE_STAFF]                 | Type 5           | [PATIENT]        | Different Client | ❌ FORBIDDEN   | Restricted to same client                               |
| Type 4 [OFFICE_STAFF, CLIENT_ADMIN]   | Type 1           | [SUPER_ADMIN]    | Any Client       | ❌ FORBIDDEN   | Cannot create SUPER_ADMIN (even with CLIENT_ADMIN role) |
| Type 4 [OFFICE_STAFF, CLIENT_ADMIN]   | Any Type         | Any Roles        | Different Client | ❌ FORBIDDEN   | Restricted to same client                               |
| Type 5 [PATIENT]                      | Any Type         | Any Roles        | Any Client       | ❌ FORBIDDEN   | PATIENT cannot create anyone                            |
| Any Type                              | Type 1           | [CLIENT_ADMIN]   | Any Client       | ❌ BAD_REQUEST | Invalid Type-Role combination                           |
| Any Type                              | Type 2           | [SUPER_ADMIN]    | Any Client       | ❌ BAD_REQUEST | Invalid Type-Role combination                           |
| Any Type                              | Type 3           | [PATIENT]        | Any Client       | ❌ BAD_REQUEST | Invalid Type-Role combination                           |
| Any Type                              | Type 4           | [CLINICAL_STAFF] | Any Client       | ❌ BAD_REQUEST | Invalid Type-Role combination                           |
| Any Type                              | Type 5           | [OFFICE_STAFF]   | Any Client       | ❌ BAD_REQUEST | Invalid Type-Role combination                           |

### **🎪 Key Authorization Principles**

1. **Role Inheritance**: Users with `CLIENT_ADMIN` role (regardless of user type) inherit `CLIENT_ADMIN` creation privileges
2. **Client Boundaries**: Only `SYSTEM_ADMIN` can work across clients; all others restricted to same client
3. **Type-Role Consistency**: Target user type must match allowed role combinations
4. **SUPER_ADMIN Protection**: Only `SYSTEM_ADMIN` can create `SUPER_ADMIN` users
5. **Hierarchical Permissions**: Higher privilege roles can create lower privilege roles (with restrictions)
