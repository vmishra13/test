# Authorization Module Restructure Plan

## Current Structure Issues

- Authorization logic is in `src/shared/authorization.ts`
- Only used by user management features
- Tightly coupled with user/role domain concepts
- Not truly "shared" functionality

## Proposed New Structure

### 1. Move Authorization Service

**FROM:** `src/shared/authorization.ts`
**TO:** `src/features/auth/services/authorization.service.ts`

### 2. Create Supporting Files Structure

```
src/features/auth/
├── services/
│   ├── auth.service.ts (existing)
│   ├── token.service.ts (existing)
│   └── authorization.service.ts (NEW - moved from shared)
├── types/
│   └── authorization.types.ts (NEW - extract types)
├── utils/
│   └── rbac.utils.ts (NEW - extract role utilities)
└── constants/
    └── permissions.ts (NEW - extract permission constants)
```

### 3. Extract and Organize Components

#### authorization.service.ts

- `performAuthorization()`
- `createAuthRequest()`
- `getCurrentUser()`
- `validateUserRegistrationAccess()`
- `validateUserViewAccess()`

#### authorization.types.ts

- `AuthRequest` interface
- `RequestUserAction` enum
- Related type definitions

#### rbac.utils.ts

- `getCurrentUserPrimaryRole()`
- Role comparison utilities
- Permission checking helpers

### 4. Update Import Paths

**Current imports:**

```typescript
import { createAuthRequest, getCurrentUser, performAuthorization } from '@shared/authorization';
```

**New imports:**

```typescript
import {
  createAuthRequest,
  getCurrentUser,
  performAuthorization,
} from '@features/auth/services/authorization.service';
// OR with path alias:
import { createAuthRequest, getCurrentUser, performAuthorization } from '@features/auth';
```

### 5. Benefits of This Structure

1. **Domain Alignment**: Authorization logic lives within the auth feature domain
2. **Feature Cohesion**: All auth-related services are co-located
3. **Better Separation**: Clear distinction between generic shared utilities and domain-specific auth logic
4. **Scalability**: Easier to extend authorization with new features (audit logs, policy engines, etc.)
5. **Testing**: Easier to test auth-related functionality in isolation

### 6. Migration Steps

1. Create new authorization service file in auth feature
2. Extract types to separate file
3. Update all import statements
4. Update path aliases in tsconfig.json if needed
5. Move shared constants to auth feature constants
6. Update tests and documentation
7. Remove old shared/authorization.ts file

### 7. Path Alias Consideration

Add to tsconfig.json paths:

```json
"@auth/*": ["features/auth/*"],
"@auth/services/*": ["features/auth/services/*"]
```

This allows cleaner imports:

```typescript
import { performAuthorization } from '@auth/services/authorization.service';
```
