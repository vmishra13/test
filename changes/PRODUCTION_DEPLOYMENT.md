# Production Deployment Guide

## ✅ Problem Solved

**Issue**: Critical packages were in `devDependencies` but needed for production runtime.

**Solution Applied**:
- Moved `tsconfig-paths` to `dependencies` (required for TypeScript path resolution)
- Updated production start script to use native Node.js environment variable setting
- Kept `cross-env` in `devDependencies` (only needed for development/testing)

## Fixed Package.json Scripts

```json
{
  "scripts": {
    "start": "NODE_ENV=production node -r tsconfig-paths/register dist/index.js",
    "start:cross-env": "cross-env NODE_ENV=production node -r tsconfig-paths/register dist/index.js",
    "start:win": "set NODE_ENV=production&& node -r tsconfig-paths/register dist/index.js"
  }
}
```

## Production Dependencies (27 packages)
✅ All runtime libraries correctly placed:
- Express.js and middleware (cors, helmet, etc.)
- AWS SDK clients (S3, SES, SNS, Secrets Manager)
- Database clients (@prisma/client)
- Authentication (bcrypt, jsonwebtoken)
- Utilities (winston, zod, moment, etc.)
- **tsconfig-paths** (for TypeScript path resolution)

## Development Dependencies (24 packages)
✅ Build/development tools correctly placed:
- TypeScript and @types/* packages
- Testing framework (jest, supertest)
- Code quality (eslint, prettier)
- Development server (tsx)
- **cross-env** (for cross-platform env vars in dev)

## Deployment Commands

### Recommended: Pre-built Deployment
```bash
# Build phase (CI/CD with all dependencies)
pnpm install
pnpm run build
pnpm run generate

# Production deployment (runtime dependencies only)
pnpm install --production
NODE_ENV=production node -r tsconfig-paths/register dist/index.js
```

### Alternative: Using pnpm start
```bash
pnpm install --production
pnpm start  # Uses the fixed start script
```

## Platform-Specific Commands

### Linux/macOS Production
```bash
NODE_ENV=production node -r tsconfig-paths/register dist/index.js
```

### Windows Production
```bash
set NODE_ENV=production&& node -r tsconfig-paths/register dist/index.js
```

### Cross-platform (if cross-env in dependencies)
```bash
cross-env NODE_ENV=production node -r tsconfig-paths/register dist/index.js
```

## Verification

✅ **Production install works**: `pnpm install --production` installs 27 packages  
✅ **Build passes**: TypeScript compilation successful  
✅ **Runtime dependencies**: All essential packages available  
✅ **Path resolution**: tsconfig-paths available for TypeScript path mapping  

## What Changed

1. **Moved to dependencies**: `tsconfig-paths` (required at runtime)
2. **Updated start script**: Direct NODE_ENV setting (no cross-env dependency)
3. **Added fallback scripts**: `start:cross-env` and `start:win` for alternatives
4. **Kept in devDependencies**: `cross-env` (development/testing only)
