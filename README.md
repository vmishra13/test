# 🏥 ReliaCare Backend API

> A comprehensive, HIPAA-compliant healthcare backend platform built with **Express.js**, **TypeScript**, and **Prisma ORM**.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue?style=flat-square&logo=typescript) ![Node.js](https://img.shields.io/badge/Node.js-22.16.0-green?style=flat-square&logo=node.js) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue?style=flat-square&logo=postgresql) ![Express](https://img.shields.io/badge/Express.js-5.0-lightgrey?style=flat-square&logo=express) ![Prisma](https://img.shields.io/badge/Prisma-6.10.0-darkgreen?style=flat-square&logo=prisma) ![pnpm](https://img.shields.io/badge/pnpm-10.0-orange?style=flat-square&logo=pnpm)

---

## 📋 **Table of Contents**

- [🌟 Key Features](#-key-features)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [� Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [📋 Prerequisites](#-prerequisites)
- [⚙️ Installation & Setup](#️-installation--setup)
- [🔧 Available Scripts](#-available-scripts)
- [🗄️ Database Management](#️-database-management)
- [🌍 Environment Configuration](#-environment-configuration)
- [📚 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🔒 Security & Compliance](#-security--compliance)
- [🏭 Production Deployment](#-production-deployment)
- [🤝 Contributing](#-contributing)
- [📝 Engineering Principles](#-engineering-principles)

---

## � **Key Features**

### **🏥 Healthcare Management**

- 🩺 **Diagnosis Master** - ICD-10 compliant diagnosis codes and descriptions
- 💊 **Medications Master** - Comprehensive pharmaceutical database management
- 🏃‍♂️ **Exercises Master** - Therapeutic exercise library with detailed instructions
- 📋 **Treatment Plans** - Patient care plan creation and management
- 📅 **Patient Schedules** - Session scheduling and automated reminders
- 📝 **Activity Logs** - Detailed audit trail for all patient interactions

### **🔐 Security & Architecture**

- 🛡️ **Multi-tenant Architecture** - Complete client isolation and data segregation
- 🔑 **OAuth 2.0 Authentication** - Secure token-based authentication system
- 👥 **Role-based Access Control** - Granular permission management (Admin, Doctor, Patient)
- 🛡️ **HIPAA Compliance** - Enterprise-grade security and audit logging
- 🔒 **Data Encryption** - At-rest and in-transit data protection

### **⚡ Developer Experience**

- 📊 **RESTful API Design** - Consistent, well-documented endpoints
- 🧪 **Comprehensive Testing** - Unit and integration test coverage
- 📈 **Production Ready** - Logging, monitoring, and error handling
- 🔄 **Hot Reload** - Fast development with automatic server restart
- 📝 **TypeScript First** - Full type safety and IntelliSense support

---

## 🏗️ **Architecture Overview**

ReliaCare follows a **feature-based vertical slice architecture** designed for healthcare applications, ensuring scalability, maintainability, and regulatory compliance.

### **🎯 Core Architecture Principles**

- **🔧 Vertical Slicing**: Each healthcare feature is self-contained with its own MVC layers
- **🛡️ Security First**: HIPAA compliance and multi-tenant isolation built-in
- **📦 Separation of Concerns**: Clear boundaries between presentation, business, and data layers
- **� Dependency Injection**: Testable and maintainable code structure
- **📝 Type Safety**: Full TypeScript coverage for reliability and developer experience

### **🏥 Healthcare Domain Models**

Our system manages comprehensive healthcare data through these core entities:

| **Domain**               | **Models**                   | **Purpose**                                       |
| ------------------------ | ---------------------------- | ------------------------------------------------- |
| **🔐 Authentication**    | `users`, `roles`, `sessions` | Multi-tenant user management and authentication   |
| **🏢 Organization**      | `clients`, `client_settings` | Healthcare organization management                |
| **🩺 Clinical Data**     | `diagnosis_master`           | ICD-10 compliant diagnosis codes and descriptions |
| **💊 Pharmaceuticals**   | `medication_master`          | Comprehensive medication database with dosing     |
| **🏃‍♂️ Therapy**           | `exercise_master`            | Therapeutic exercise library with instructions    |
| **📋 Care Planning**     | `plan`, `patient_plan`       | Treatment plan creation and assignment            |
| **📅 Scheduling**        | `patient_plan_schedule`      | Session scheduling and time management            |
| **📝 Activity Tracking** | `patient_plan_schedule_log`  | Detailed audit trail and progress tracking        |

### **🔗 Technical Stack**

| **Layer**           | **Technology**      | **Purpose**                                |
| ------------------- | ------------------- | ------------------------------------------ |
| **Runtime**         | Node.js 22.16       | JavaScript runtime environment             |
| **Framework**       | Express.js 4.18+    | Web application framework                  |
| **Language**        | TypeScript 5.0+     | Type-safe JavaScript development           |
| **Database**        | PostgreSQL 15+      | Primary relational database                |
| **ORM**             | Prisma 5.0+         | Type-safe database client                  |
| **Authentication**  | OAuth 2.0 + JWT     | Secure token-based authentication          |
| **Testing**         | Jest                | Unit and integration testing               |
| **API Docs**        | Postman Collections | Comprehensive API documentation            |
| **Package Manager** | pnpm                | Fast, disk space efficient package manager |

### **🌐 Multi-Tenant Architecture**

Every healthcare organization operates independently with complete data isolation:

```typescript
// Example: All operations are scoped to clientId
const medications = await medicationRepository.findByClientId(clientId);
const userPlans = await planRepository.findByClientAndUser(clientId, userId);
```

**Data Isolation Strategy:**

- **Database Level**: All tables include `clientId` for tenant separation
- **Application Level**: Middleware enforces tenant context in all operations
- **API Level**: Routes validate tenant access permissions
- **Security Level**: JWT tokens include tenant claims for authorization

---

## 📁 **Project Structure**

ReliaCare follows a **feature-based vertical slice architecture** for maximum scalability and maintainability in healthcare applications.

```
reliacare-backend/
├── 📂 src/                            # Source code
│   ├── 🔧 config/                     # Application configuration
│   │   ├── database.ts                # Database connection setup
│   │   ├── env.ts                     # Environment variable validation
│   │   └── logger.ts                  # Structured logging configuration
│   │
│   ├── 🏥 features/                   # Healthcare domain features (vertical slices)
│   │   ├── 🔐 auth/                   # Authentication & Authorization
│   │   │   ├── controllers/           # OAuth 2.0 login/logout handlers
│   │   │   ├── services/              # JWT token management
│   │   │   ├── middlewares/           # Auth validation middleware
│   │   │   └── routes/                # /auth/* endpoints
│   │   │
│   │   ├── 👤 users/                  # User Management
│   │   │   ├── controllers/           # User CRUD operations
│   │   │   ├── services/              # User business logic
│   │   │   ├── repositories/          # User data access
│   │   │   ├── dto/                   # User data transfer objects
│   │   │   ├── validators/            # User input validation
│   │   │   ├── types/                 # User TypeScript definitions
│   │   │   └── routes/                # /users/* endpoints
│   │   │
│   │   ├── 🏢 clients/                # Healthcare Organizations
│   │   │   ├── controllers/           # Organization management
│   │   │   ├── services/              # Multi-tenant business logic
│   │   │   ├── repositories/          # Client data operations
│   │   │   └── routes/                # /clients/* endpoints
│   │   │
│   │   ├── 🩺 diagnosis/              # Medical Diagnosis (ICD-10)
│   │   │   ├── controllers/           # Diagnosis CRUD operations
│   │   │   ├── services/              # ICD-10 validation logic
│   │   │   ├── repositories/          # Diagnosis data access
│   │   │   ├── dto/                   # Diagnosis request/response DTOs
│   │   │   ├── validators/            # Medical code validation
│   │   │   └── routes/                # /diagnosis/* endpoints
│   │   │
│   │   ├── 💊 medications/            # Pharmaceutical Database
│   │   │   ├── controllers/           # Medication CRUD operations
│   │   │   ├── services/              # Drug interaction checks
│   │   │   ├── repositories/          # Medication data access
│   │   │   ├── dto/                   # Medication DTOs
│   │   │   ├── validators/            # Dosage validation
│   │   │   └── routes/                # /medications/* endpoints
│   │   │
│   │   ├── 🏃‍♂️ exercises/             # Therapeutic Exercises
│   │   │   ├── controllers/           # Exercise CRUD operations
│   │   │   ├── services/              # Exercise prescription logic
│   │   │   ├── repositories/          # Exercise data access
│   │   │   ├── dto/                   # Exercise DTOs
│   │   │   ├── validators/            # Exercise validation
│   │   │   └── routes/                # /exercises/* endpoints
│   │   │
│   │   ├── 📋 plans/                  # Treatment Plans & Schedules
│   │   │   ├── controllers/           # Plan management
│   │   │   │   ├── plan.controller.ts              # Plan CRUD
│   │   │   │   ├── patient-plan.controller.ts      # Patient assignments
│   │   │   │   ├── schedule.controller.ts          # Scheduling
│   │   │   │   └── schedule-log.controller.ts      # Activity logging
│   │   │   ├── services/              # Care plan business logic
│   │   │   ├── repositories/          # Plan data operations
│   │   │   ├── dto/                   # Plan-related DTOs
│   │   │   ├── validators/            # Plan validation rules
│   │   │   └── routes/                # /plans/* endpoints
│   │   │
│   │   ├── �️ roles/                  # Role-Based Access Control
│   │   │   ├── controllers/           # Permission management
│   │   │   ├── services/              # Authorization logic
│   │   │   └── routes/                # /roles/* endpoints
│   │   │
│   │   └── � contacts/               # Contact Management
│   │       ├── controllers/           # Contact CRUD operations
│   │       ├── services/              # Contact business logic
│   │       └── routes/                # /contacts/* endpoints
│   │
│   ├── 🛠️ shared/                     # Shared utilities & components
│   │   ├── constants/                 # Application-wide constants
│   │   ├── utils/                     # Utility functions
│   │   ├── middlewares/               # Common middleware (CORS, validation)
│   │   ├── types/                     # Shared TypeScript definitions
│   │   └── errors/                    # Custom error classes
│   │
│   ├── 🗄️ db/                         # Database schemas & clients
│   │   ├── postgres/                  # PostgreSQL setup
│   │   │   ├── schema.prisma          # Prisma schema definition
│   │   │   └── client.ts              # Database client initialization
│   │   └── mongodb/                   # MongoDB setup (future expansion)
│   │       └── client.ts              # MongoDB client (planned)
│   │
│   ├── 🚀 api/                        # API routing & middleware
│   │   └── v1/                        # API version 1
│   │       └── index.ts               # Route aggregation and mounting
│   │
│   └── 📁 app.ts                      # Express app configuration
│   └── 📁 server.ts                   # Server startup and listening
│
├── 📊 postman/                        # API documentation & testing
│   └── ReliaCare APIs.postman_collection.json  # Complete API collection
│
├── 🧪 tests/                          # Test suites
│   ├── unit/                          # Unit tests for individual components
│   │   ├── services/                  # Service layer tests
│   │   ├── repositories/              # Data layer tests
│   │   └── utils/                     # Utility function tests
│   ├── integration/                   # End-to-end API tests
│   │   ├── auth/                      # Authentication flow tests
│   │   ├── healthcare/                # Healthcare feature tests
│   │   └── api/                       # API endpoint tests
│   └── fixtures/                      # Test data and mocks
│
├── 📚 database/                       # Database setup & migrations
│   └── postgres/                      # PostgreSQL specific files
│       ├── sql/                       # SQL migration scripts
│       ├── seeds/                     # Database seeding scripts
│       └── backup/                    # Database backup utilities
│
├── 📋 docs/                           # Documentation
│   ├── changes/                       # Implementation progress tracking
│   ├── api/                           # API documentation
│   ├── deployment/                    # Deployment guides
│   └── architecture/                  # System architecture docs
│
├── 🔧 Configuration files
├── 📄 package.json                    # Dependencies and scripts
├── � tsconfig.json                   # TypeScript configuration
├── 📄 jest.config.ts                  # Testing configuration
├── 📄 .env.example                    # Environment variables template
└── 📄 README.md                       # This file
```

### **🎯 Feature Architecture Pattern**

Each feature in `/src/features/` follows a consistent vertical slice pattern:

```
feature-name/
├── 📥 controllers/          # HTTP request/response handling
│   └── feature.controller.ts
├── � services/             # Business logic and orchestration
│   └── feature.service.ts
├── 🗄️ repositories/         # Data access and database operations
│   └── feature.repository.ts
├── 📋 dto/                  # Data transfer objects (request/response)
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   └── feature-response.dto.ts
├── ✅ validators/           # Input validation schemas
│   └── feature.validators.ts
├── 🛣️ routes/               # API endpoint definitions
│   └── feature.routes.ts
└── 📝 types/                # TypeScript type definitions
    └── feature.types.ts
```

This structure ensures:

- **� Easy Navigation**: Find all related code in one place
- **🧪 Testability**: Each layer can be tested independently
- **🔄 Maintainability**: Changes are isolated to specific features
- **� Scalability**: New features follow the same proven pattern

---

## 🚀 **Quick Start**

Get up and running with ReliaCare in under 5 minutes:

```bash
# 1. Clone repository
git clone https://git-codecommit.us-west-2.amazonaws.com/v1/repos/reliacare-backend
cd reliacare-backend

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env  # Configure your database URLs and secrets

# 4. Setup database and generate clients (one command!)
pnpm setup:postgres

# 5. Start development server
pnpm dev
```

🎉 **Your server is now running at http://localhost:3000**

### **🔥 First API Call**

Test your setup with a health check:

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "ReliaCare Backend API",
  "version": "1.0.0"
}
```

---

## 📋 **Prerequisites**

### **System Requirements**

| **Component**  | **Version** | **Purpose**        |
| -------------- | ----------- | ------------------ |
| **Node.js**    | v22.16.0+   | JavaScript runtime |
| **pnpm**       | v10.0+      | Package manager    |
| **PostgreSQL** | v17.0+      | Primary database   |
| **Git**        | v2.0+       | Version control    |

### **1. Install Node.js**

**Download and install Node.js v18 or higher** from [nodejs.org](https://nodejs.org/)

```bash
# Verify installation
node --version  # Should output v22.16.0 or higher
npm --version   # Should output v9.0.0 or higher
```

**Alternative installations:**

```bash
# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22

# Using Homebrew (macOS)
brew install node@22

# Using Chocolatey (Windows)
choco install nodejs --version=22.16.0
```

### **2. Install pnpm Package Manager**

pnpm is faster and more disk-efficient than npm:

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version  # Should output v10.0.0 or higher
```

**Alternative installation methods:**

```bash
# Using Homebrew (macOS)
brew install pnpm

# Using Chocolatey (Windows)
choco install pnpm

# Using Scoop (Windows)
scoop install pnpm

# Using standalone script
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### **3. Install PostgreSQL**

**Option A: Local Installation**

```bash
# macOS using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# Windows using Chocolatey
choco install postgresql15
```

**Option B: Docker (Recommended for Development)**

```bash
# Start PostgreSQL in Docker
docker run --name reliacare-postgres \
  -e POSTGRES_USER=root \
  -e POSTGRES_PASSWORD=biddiaSQL \
  -e POSTGRES_DB=reliacare \
  -p 5432:5432 \
  -d postgres:15

# Verify connection
docker exec -it reliacare-postgres psql -U root -d reliacare
```

**Option C: Cloud Database**

Consider using managed PostgreSQL services:

- **AWS RDS** (recommended for production)
- **Google Cloud SQL**
- **Azure Database for PostgreSQL**
- **Supabase** (great for development)

---

## ⚙️ **Installation & Setup**

### **1. Clone Repository**

```bash
# Clone from AWS CodeCommit
git clone https://git-codecommit.us-west-2.amazonaws.com/v1/repos/reliacare-backend

# Navigate to project directory
cd reliacare-backend

# Verify project structure
ls -la
```

### **2. Install Dependencies**

```bash
# Install all project dependencies
pnpm install

# This will install:
# - Production dependencies (Express, Prisma, etc.)
# - Development dependencies (TypeScript, Jest, etc.)
# - Type definitions
```

### **3. Database Setup**

**Step 1: Create Database and Schema**

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE reliacare;

-- Create user (if not exists)
CREATE USER root WITH PASSWORD 'biddiaSQL';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE reliacare TO root;

-- Connect to reliacare database
\c reliacare

-- Create schema
CREATE SCHEMA reliacare;

-- Grant schema privileges
GRANT ALL ON SCHEMA reliacare TO root;
```

**Step 2: Run Database Scripts**

```bash
# Navigate to database scripts directory
cd database/postgres/sql

# Execute database setup script
sh nonprod_postgres_runscript.sh reliacare root biddiaSQL

# Return to project root
cd ../../../
```

### **4. Environment Configuration**

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

**Required Environment Variables:**

```env
# Database Configuration
DATABASE_URL="postgresql://root:biddiaSQL@localhost:5432/reliacare"
DATABASE_SCHEMA="reliacare"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Application Configuration
NODE_ENV="development"
PORT=3000
API_VERSION="v1"

# CORS Configuration
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"

# Logging Configuration
LOG_LEVEL="info"
LOG_FORMAT="combined"
```

### **5. Generate Prisma Clients**

```bash
# Generate TypeScript client from schema
pnpm generate

# This creates:
# - Type-safe database client
# - TypeScript type definitions
# - Query builder interfaces
```

### **6. Start Development Server**

```bash
# Start server with hot reload
pnpm dev

# Expected output:
# 🚀 ReliaCare Backend API is running on http://localhost:3000
# 🗄️ Database connected successfully
# 📚 API documentation available at /api-docs
```

### **7. Verify Installation**

**Test API endpoints:**

```bash
# Health check
curl http://localhost:3000/api/v1/health

# API documentation
open http://localhost:3000/api-docs  # or visit in browser
```

**Expected health check response:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "ReliaCare Backend API",
  "version": "1.0.0",
  "database": "connected",
  "uptime": "0:01:30"
}
```

---

## 🔧 **Available Scripts**

ReliaCare provides a comprehensive set of scripts for development, testing, and deployment:

### **🔥 Development Scripts**

| **Script**      | **Command**       | **Description**                                                     |
| --------------- | ----------------- | ------------------------------------------------------------------- |
| **Development** | `pnpm dev`        | Start development server with hot reload and TypeScript compilation |
| **Build**       | `pnpm build`      | Compile TypeScript to JavaScript for production                     |
| **Production**  | `pnpm start`      | Start production server (requires build)                            |
| **Type Check**  | `pnpm type-check` | Run TypeScript compiler without emitting files                      |
| **Lint**        | `pnpm lint`       | Run ESLint for code quality checks                                  |
| **Format**      | `pnpm format`     | Format code using Prettier                                          |

```bash
# Example development workflow
pnpm dev          # Start development with hot reload
pnpm lint         # Check code quality
pnpm type-check   # Verify TypeScript types
pnpm build        # Compile for production
pnpm start        # Run production build
```

### **🗄️ Database Scripts**

| **Script**            | **Command**              | **Description**                                                    |
| --------------------- | ------------------------ | ------------------------------------------------------------------ |
| **🚀 Complete Setup** | `pnpm setup:postgres`    | **One-command database setup** (runs SQL script + pull + generate) |
| **Generate All**      | `pnpm generate`          | Generate Prisma clients for all databases                          |
| **PostgreSQL**        | `pnpm generate:postgres` | Generate PostgreSQL Prisma client only                             |
| **MongoDB**           | `pnpm generate:mongodb`  | Generate MongoDB Prisma client only                                |
| **Pull Schema**       | `pnpm pull`              | Pull latest schema from all databases                              |
| **PostgreSQL Pull**   | `pnpm pull:postgres`     | Pull PostgreSQL schema only                                        |
| **MongoDB Pull**      | `pnpm pull:mongodb`      | Pull MongoDB schema only                                           |
| **Clean**             | `pnpm db:clean`          | Remove generated Prisma clients                                    |
| **Full Sync**         | `pnpm db:sync`           | Pull latest schema + regenerate clients                            |

```bash
# Example database workflow
pnpm setup:postgres               # 🚀 Complete database setup (recommended)
pnpm pull:postgres          # Pull latest PostgreSQL schema
pnpm generate:postgres      # Generate TypeScript client
pnpm db:sync               # Full sync (pull + generate)
```

### **🧪 Testing Scripts**

| **Script**            | **Command**             | **Description**               |
| --------------------- | ----------------------- | ----------------------------- |
| **All Tests**         | `pnpm test`             | Run all test suites           |
| **Unit Tests**        | `pnpm test:unit`        | Run unit tests only           |
| **Integration Tests** | `pnpm test:integration` | Run integration tests only    |
| **Test Coverage**     | `pnpm test:coverage`    | Generate test coverage report |
| **Test Watch**        | `pnpm test:watch`       | Run tests in watch mode       |

```bash
# Example testing workflow
pnpm test              # Run all tests
pnpm test:unit         # Run unit tests
pnpm test:coverage     # Generate coverage report
pnpm test:watch        # Watch mode for TDD
```

### **🔍 Database Management Tools**

| **Tool**              | **Command**            | **Description**                     |
| --------------------- | ---------------------- | ----------------------------------- |
| **PostgreSQL Studio** | `pnpm studio:postgres` | Open Prisma Studio for PostgreSQL   |
| **MongoDB Studio**    | `pnpm studio:mongodb`  | Open Prisma Studio for MongoDB      |
| **Database Reset**    | `pnpm db:reset`        | Reset database and apply migrations |
| **Seed Data**         | `pnpm db:seed`         | Populate database with initial data |

```bash
# Open database management interface
pnpm studio:postgres   # Visual database browser
pnpm db:seed          # Add sample data
```

### **� Utility Scripts**

| **Script**          | **Command**          | **Description**                      |
| ------------------- | -------------------- | ------------------------------------ |
| **Dependencies**    | `pnpm deps:check`    | Check for outdated dependencies      |
| **Security Audit**  | `pnpm audit`         | Run security vulnerability scan      |
| **Clean Install**   | `pnpm clean-install` | Remove node_modules and reinstall    |
| **Bundle Analysis** | `pnpm analyze`       | Analyze bundle size and dependencies |

```bash
# Maintenance and optimization
pnpm deps:check        # Check for updates
pnpm audit            # Security scan
pnpm clean-install    # Fresh dependency install
```

---

## 🗄️ **Database Management**

### **🔄 Schema Synchronization Workflow**

Understanding when and how to use database scripts is crucial for maintaining consistency across development environments.

#### **When to Use `pnpm pull:postgres`**

Use this command when you need to synchronize your local Prisma schema with the actual database structure:

✅ **Required scenarios:**

- **After database migrations** (when someone else has modified the database structure)
- **When switching between branches** that may have different database schemas
- **When joining the project** for the first time
- **After manual database changes** made directly in the database
- **When you see schema drift warnings** in Prisma operations

```bash
# Pull latest schema from PostgreSQL database
pnpm pull:postgres

# Then regenerate the client (always required after pull)
pnpm generate:postgres
```

#### **When to Use `pnpm generate:postgres`**

Use this command to regenerate the Prisma client after schema changes:

✅ **Required scenarios:**

- **After `pnpm pull:postgres`** (always follow pull with generate)
- **After modifying** `src/db/postgres/schema.prisma` manually
- **When TypeScript shows** Prisma client type errors
- **After installing dependencies** (especially in CI/CD environments)
- **When Prisma client is missing** or corrupted

```bash
# Generate PostgreSQL Prisma client
pnpm generate:postgres
```

### **📋 Common Workflow Patterns**

#### **🔄 Daily Development Workflow**

```bash
# 1. Pull latest code
git pull origin main

# 2. Install any new dependencies
pnpm install

# 3. Sync database schema (if database was modified)
pnpm pull:postgres && pnpm generate:postgres

# 4. Start development
pnpm dev
```

#### **🆕 New Developer Setup**

```bash
# 1. Clone and install
git clone <repo-url>
cd reliacare-backend
pnpm install

# 2. Setup environment
cp .env.example .env  # Configure database URLs

# 3. Pull schema and generate clients
pnpm db:sync

# 4. Start development
pnpm dev
```

#### **🔧 After Database Changes**

```bash
# If someone modified the database structure:
pnpm pull:postgres    # Get latest schema
pnpm generate:postgres # Regenerate client

# If you see "Schema drift detected" errors:
pnpm db:sync          # Full sync (pull + generate)
```

#### **🚀 Production Deployment**

```bash
# 1. Install dependencies
pnpm install --prod

# 2. Generate Prisma clients
pnpm generate

# 3. Build application
pnpm build

# 4. Start production server
pnpm start
```

### **⚠️ Important Notes**

- **Always run `generate` after `pull`** - pulling updates the schema file, but doesn't update the TypeScript client
- **Check `.env` file** - ensure database URLs are correct before pulling
- **Commit schema changes** - if `pull` modifies your schema file, commit those changes
- **CI/CD environments** - always run `pnpm generate` in build pipelines

### **🔍 Database Troubleshooting**

**Common Issues and Solutions:**

| **Issue**            | **Symptom**                           | **Solution**                                   |
| -------------------- | ------------------------------------- | ---------------------------------------------- |
| **Schema Drift**     | "Schema drift detected" error         | `pnpm pull:postgres && pnpm generate:postgres` |
| **Missing Client**   | "Cannot find module '@prisma/client'" | `pnpm generate:postgres`                       |
| **Type Errors**      | TypeScript errors with Prisma types   | `pnpm generate:postgres`                       |
| **Connection Error** | "Can't reach database server"         | Check DATABASE_URL in .env                     |
| **Permission Error** | "Permission denied" on database       | Verify database user permissions               |

```bash
# Diagnostic commands
pnpm prisma db pull --help    # Check pull command options
pnpm prisma generate --help   # Check generate command options
pnpm prisma validate         # Validate schema syntax
pnpm prisma format           # Format schema file
```

---

## 🌍 **Environment Configuration**

ReliaCare uses environment variables for secure and flexible configuration across different deployment environments.

### **📋 Required Environment Variables**

Create a `.env` file in the root directory with the following configuration:

```env
# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DATABASE_URL="postgresql://root:biddiaSQL@localhost:5432/reliacare"
DATABASE_SCHEMA="reliacare"

# Optional: MongoDB (future expansion)
MONGODB_URL="mongodb://localhost:27017/reliacare"

# =============================================================================
# JWT & AUTHENTICATION
# =============================================================================
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# OAuth providers (optional)
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV="development"  # development | production | test
PORT=3000
API_VERSION="v1"
API_PREFIX="/api"

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"
CORS_CREDENTIALS="true"

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
LOG_LEVEL="info"        # error | warn | info | debug
LOG_FORMAT="combined"   # combined | common | dev | short | tiny

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# =============================================================================
# EMAIL CONFIGURATION (optional)
# =============================================================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@reliacare.com"

# =============================================================================
# FILE UPLOAD CONFIGURATION
# =============================================================================
MAX_FILE_SIZE="10485760"  # 10MB in bytes
UPLOAD_DIR="./uploads"

# AWS S3 (optional, for production file storage)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-west-2"
AWS_S3_BUCKET="reliacare-uploads"

# =============================================================================
# MONITORING & ANALYTICS (optional)
# =============================================================================
SENTRY_DSN="your-sentry-dsn-for-error-tracking"
GOOGLE_ANALYTICS_ID="GA-XXXXXXXXX"

# =============================================================================
# FEATURE FLAGS (optional)
# =============================================================================
ENABLE_API_DOCS="true"
ENABLE_SWAGGER_UI="true"
ENABLE_METRICS="true"
ENABLE_HEALTH_CHECK="true"
```

### **🔒 Environment-Specific Configurations**

#### **Development Environment**

```env
NODE_ENV="development"
LOG_LEVEL="debug"
ENABLE_API_DOCS="true"
ENABLE_SWAGGER_UI="true"
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"
```

#### **Production Environment**

```env
NODE_ENV="production"
LOG_LEVEL="warn"
ENABLE_API_DOCS="false"
ENABLE_SWAGGER_UI="false"
CORS_ORIGIN="https://yourdomain.com"
JWT_SECRET="your-very-secure-production-secret"
DATABASE_URL="postgresql://user:password@prod-db:5432/reliacare"
```

#### **Testing Environment**

```env
NODE_ENV="test"
DATABASE_URL="postgresql://root:biddiaSQL@localhost:5432/reliacare_test"
JWT_SECRET="test-secret-key"
LOG_LEVEL="error"
RATE_LIMIT_MAX_REQUESTS=1000
```

### **🛡️ Security Best Practices**

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (minimum 32 characters, random)
3. **Rotate secrets regularly** in production
4. **Use environment-specific configurations**
5. **Validate environment variables** at startup

### **✅ Environment Validation**

ReliaCare automatically validates environment variables at startup:

```typescript
// Example validation in src/config/env.ts
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

---

## 📚 **API Documentation**

### **📖 Interactive API Documentation**

ReliaCare provides comprehensive API documentation through multiple channels:

#### **🚀 Postman Collection**

The complete API collection is available in `/postman/ReliaCare APIs.postman_collection.json`:

**Features:**

- **🔐 Authentication flows** with example tokens
- **📋 Complete CRUD operations** for all healthcare entities
- **🧪 Pre-configured test cases** and assertions
- **🌍 Environment variables** for different deployment stages
- **📝 Detailed request/response examples**

**Import into Postman:**

1. Open Postman
2. Click "Import" → "Upload Files"
3. Select `/postman/ReliaCare APIs.postman_collection.json`
4. Configure environment variables for your setup

#### **📊 Swagger UI (Development)**

When running in development mode:

```bash
pnpm dev
# Visit: http://localhost:3000/api-docs
```

### **🏥 Healthcare API Endpoints**

#### **🔐 Authentication**

| **Method** | **Endpoint**            | **Description**     | **Body**                        |
| ---------- | ----------------------- | ------------------- | ------------------------------- |
| `POST`     | `/api/v1/auth/login`    | User authentication | `{ email, password }`           |
| `POST`     | `/api/v1/auth/register` | User registration   | `{ email, password, clientId }` |
| `POST`     | `/api/v1/auth/refresh`  | Refresh JWT token   | `{ refreshToken }`              |
| `POST`     | `/api/v1/auth/logout`   | User logout         | `{ refreshToken }`              |

#### **👤 User Management**

| **Method** | **Endpoint**        | **Description**            | **Body**                              |
| ---------- | ------------------- | -------------------------- | ------------------------------------- |
| `GET`      | `/api/v1/users`     | List all users (paginated) | N/A                                   |
| `GET`      | `/api/v1/users/:id` | Get user by ID             | N/A                                   |
| `POST`     | `/api/v1/users`     | Create new user            | `{ email, password, role, clientId }` |
| `PUT`      | `/api/v1/users/:id` | Update user                | `{ email, firstName, lastName }`      |
| `DELETE`   | `/api/v1/users/:id` | Delete user                | N/A                                   |

#### **🏢 Client Management**

| **Method** | **Endpoint**          | **Description**   | **Body**                      |
| ---------- | --------------------- | ----------------- | ----------------------------- |
| `GET`      | `/api/v1/clients`     | List all clients  | N/A                           |
| `GET`      | `/api/v1/clients/:id` | Get client by ID  | N/A                           |
| `POST`     | `/api/v1/clients`     | Create new client | `{ name, address, settings }` |
| `PUT`      | `/api/v1/clients/:id` | Update client     | `{ name, address }`           |
| `DELETE`   | `/api/v1/clients/:id` | Delete client     | N/A                           |

#### **🩺 Medical Diagnosis**

| **Method** | **Endpoint**            | **Description**      | **Body**                                |
| ---------- | ----------------------- | -------------------- | --------------------------------------- |
| `GET`      | `/api/v1/diagnosis`     | List all diagnoses   | N/A                                     |
| `GET`      | `/api/v1/diagnosis/:id` | Get diagnosis by ID  | N/A                                     |
| `POST`     | `/api/v1/diagnosis`     | Create new diagnosis | `{ code, name, description, category }` |
| `PUT`      | `/api/v1/diagnosis/:id` | Update diagnosis     | `{ name, description }`                 |
| `DELETE`   | `/api/v1/diagnosis/:id` | Delete diagnosis     | N/A                                     |

#### **💊 Medications**

| **Method** | **Endpoint**              | **Description**       | **Body**                                      |
| ---------- | ------------------------- | --------------------- | --------------------------------------------- |
| `GET`      | `/api/v1/medications`     | List all medications  | N/A                                           |
| `GET`      | `/api/v1/medications/:id` | Get medication by ID  | N/A                                           |
| `POST`     | `/api/v1/medications`     | Create new medication | `{ name, dosage, instructions, sideEffects }` |
| `PUT`      | `/api/v1/medications/:id` | Update medication     | `{ name, dosage, instructions }`              |
| `DELETE`   | `/api/v1/medications/:id` | Delete medication     | N/A                                           |

#### **🏃‍♂️ Exercises**

| **Method** | **Endpoint**            | **Description**     | **Body**                                       |
| ---------- | ----------------------- | ------------------- | ---------------------------------------------- |
| `GET`      | `/api/v1/exercises`     | List all exercises  | N/A                                            |
| `GET`      | `/api/v1/exercises/:id` | Get exercise by ID  | N/A                                            |
| `POST`     | `/api/v1/exercises`     | Create new exercise | `{ name, instructions, duration, difficulty }` |
| `PUT`      | `/api/v1/exercises/:id` | Update exercise     | `{ name, instructions }`                       |
| `DELETE`   | `/api/v1/exercises/:id` | Delete exercise     | N/A                                            |

#### **📋 Treatment Plans**

| **Method** | **Endpoint**        | **Description** | **Body**                                 |
| ---------- | ------------------- | --------------- | ---------------------------------------- |
| `GET`      | `/api/v1/plans`     | List all plans  | N/A                                      |
| `GET`      | `/api/v1/plans/:id` | Get plan by ID  | N/A                                      |
| `POST`     | `/api/v1/plans`     | Create new plan | `{ name, description, goals, duration }` |
| `PUT`      | `/api/v1/plans/:id` | Update plan     | `{ name, description, goals }`           |
| `DELETE`   | `/api/v1/plans/:id` | Delete plan     | N/A                                      |

#### **👥 Patient Plans**

| **Method** | **Endpoint**                      | **Description**          | **Body**                                    |
| ---------- | --------------------------------- | ------------------------ | ------------------------------------------- |
| `GET`      | `/api/v1/plans/patient-plans`     | List patient assignments | N/A                                         |
| `GET`      | `/api/v1/plans/patient-plans/:id` | Get patient plan by ID   | N/A                                         |
| `POST`     | `/api/v1/plans/patient-plans`     | Assign plan to patient   | `{ planId, patientId, startDate, endDate }` |
| `PUT`      | `/api/v1/plans/patient-plans/:id` | Update patient plan      | `{ status, notes }`                         |
| `DELETE`   | `/api/v1/plans/patient-plans/:id` | Remove plan assignment   | N/A                                         |

#### **📅 Schedules**

| **Method** | **Endpoint**                  | **Description**     | **Body**                                     |
| ---------- | ----------------------------- | ------------------- | -------------------------------------------- |
| `GET`      | `/api/v1/plans/schedules`     | List all schedules  | N/A                                          |
| `GET`      | `/api/v1/plans/schedules/:id` | Get schedule by ID  | N/A                                          |
| `POST`     | `/api/v1/plans/schedules`     | Create new schedule | `{ patientPlanId, scheduledDate, duration }` |
| `PUT`      | `/api/v1/plans/schedules/:id` | Update schedule     | `{ scheduledDate, status }`                  |
| `DELETE`   | `/api/v1/plans/schedules/:id` | Delete schedule     | N/A                                          |

#### **📝 Schedule Logs**

| **Method** | **Endpoint**                      | **Description** | **Body**                                     |
| ---------- | --------------------------------- | --------------- | -------------------------------------------- |
| `GET`      | `/api/v1/plans/schedule-logs`     | List all logs   | N/A                                          |
| `GET`      | `/api/v1/plans/schedule-logs/:id` | Get log by ID   | N/A                                          |
| `POST`     | `/api/v1/plans/schedule-logs`     | Create new log  | `{ scheduleId, status, notes, completedAt }` |
| `PUT`      | `/api/v1/plans/schedule-logs/:id` | Update log      | `{ status, notes }`                          |
| `DELETE`   | `/api/v1/plans/schedule-logs/:id` | Delete log      | N/A                                          |

### **🔒 Authentication Examples**

#### **Login Request**

```javascript
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "doctor@reliacare.com",
  "password": "securePassword123",
  "clientId": "client-uuid-here"
}
```

#### **Login Response**

```javascript
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "doctor@reliacare.com",
      "role": "DOCTOR",
      "firstName": "Dr. John",
      "lastName": "Smith"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 604800
    }
  },
  "message": "Login successful"
}
```

#### **Authenticated Request**

```javascript
GET /api/v1/medications
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

### **📊 Response Format**

All API responses follow a consistent format:

#### **Success Response**

```javascript
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully",
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req-uuid-here"
  }
}
```

#### **Error Response**

```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req-uuid-here"
  }
}
```

#### **Paginated Response**

```javascript
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Data retrieved successfully"
}
```

---

## 🧪 **Testing**

ReliaCare maintains high code quality through comprehensive testing strategies covering unit, integration, and end-to-end testing.

### **🎯 Testing Strategy**

| **Test Type**         | **Coverage**                 | **Tools**            | **Purpose**                           |
| --------------------- | ---------------------------- | -------------------- | ------------------------------------- |
| **Unit Tests**        | Individual functions/methods | Jest + TypeScript    | Validate business logic in isolation  |
| **Integration Tests** | API endpoints                | Jest + Supertest     | Test complete request/response cycles |
| **Repository Tests**  | Database operations          | Jest + Test Database | Validate data layer functionality     |
| **Service Tests**     | Business logic layer         | Jest + Mocks         | Test service orchestration            |

### **🚀 Running Tests**

```bash
# Run all tests
pnpm test

# Run tests with coverage report
pnpm test:coverage

# Run tests in watch mode (for TDD)
pnpm test:watch

# Run only unit tests
pnpm test:unit

# Run only integration tests
pnpm test:integration

# Run tests for specific feature
pnpm test -- --testPathPattern=medications

# Run tests with verbose output
pnpm test -- --verbose
```

### **📊 Test Coverage Requirements**

ReliaCare maintains the following coverage standards:

- **Overall Coverage**: Minimum 80%
- **Business Logic (Services)**: Minimum 90%
- **API Endpoints (Controllers)**: Minimum 85%
- **Data Access (Repositories)**: Minimum 80%
- **Utilities**: Minimum 90%

### **🧪 Example Test Structure**

#### **Unit Test Example**

```typescript
// tests/unit/services/medication.service.test.ts
import { MedicationService } from '../../../src/features/medications/services/medication.service';
import { MedicationRepository } from '../../../src/features/medications/repositories/medication.repository';

describe('MedicationService', () => {
  let medicationService: MedicationService;
  let mockMedicationRepository: jest.Mocked<MedicationRepository>;

  beforeEach(() => {
    mockMedicationRepository = {
      create: jest.fn(),
      findByClientId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    medicationService = new MedicationService(mockMedicationRepository);
  });

  describe('createMedication', () => {
    it('should create medication with valid data', async () => {
      // Arrange
      const medicationData = {
        name: 'Aspirin',
        dosage: '100mg',
        clientId: 'client-123',
      };
      mockMedicationRepository.create.mockResolvedValue(medicationData as any);

      // Act
      const result = await medicationService.createMedication(medicationData);

      // Assert
      expect(mockMedicationRepository.create).toHaveBeenCalledWith(medicationData);
      expect(result).toEqual(medicationData);
    });

    it('should throw error for invalid dosage', async () => {
      // Arrange
      const invalidData = {
        name: 'Aspirin',
        dosage: 'invalid-dosage',
        clientId: 'client-123',
      };

      // Act & Assert
      await expect(medicationService.createMedication(invalidData)).rejects.toThrow(
        'Invalid dosage format',
      );
    });
  });
});
```

#### **Integration Test Example**

```typescript
// tests/integration/medications.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';

describe('Medications API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/v1/medications', () => {
    it('should create new medication', async () => {
      const medicationData = {
        name: 'Aspirin',
        dosage: '100mg',
        instructions: 'Take with food',
        sideEffects: 'May cause stomach upset',
      };

      const response = await request(app)
        .post('/api/v1/medications')
        .set('Authorization', 'Bearer valid-token')
        .send(medicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(medicationData.name);
      expect(response.body.data.dosage).toBe(medicationData.dosage);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        dosage: '100mg',
      };

      const response = await request(app)
        .post('/api/v1/medications')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for unauthorized access', async () => {
      const medicationData = {
        name: 'Aspirin',
        dosage: '100mg',
      };

      await request(app).post('/api/v1/medications').send(medicationData).expect(401);
    });
  });
});
```

### **🔧 Test Configuration**

Jest configuration in `jest.config.ts`:

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/test-*', '!src/**/*.test.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
};

export default config;
```

---

## 🔒 **Security & Compliance**

ReliaCare is built with healthcare-grade security and HIPAA compliance as core requirements.

### **🛡️ Security Features**

#### **🔐 Authentication & Authorization**

| **Feature**                     | **Implementation**       | **Standard**       |
| ------------------------------- | ------------------------ | ------------------ |
| **Multi-Factor Authentication** | JWT + Refresh Tokens     | OAuth 2.0          |
| **Role-Based Access Control**   | Hierarchical permissions | RBAC               |
| **Session Management**          | Secure token storage     | JWT Best Practices |
| **Password Security**           | bcrypt with salt rounds  | OWASP Guidelines   |

#### **🏥 HIPAA Compliance**

| **Requirement**     | **Implementation**                  | **Status**     |
| ------------------- | ----------------------------------- | -------------- |
| **Data Encryption** | AES-256 at rest, TLS 1.3 in transit | ✅ Implemented |
| **Access Controls** | Multi-tenant isolation + RBAC       | ✅ Implemented |
| **Audit Logging**   | Comprehensive activity logs         | ✅ Implemented |
| **Data Backup**     | Encrypted automated backups         | ✅ Implemented |
| **User Training**   | Security documentation              | 📋 Documented  |

#### **🔒 Data Protection**

```typescript
// Example: Automatic data encryption
const encryptedData = await encryptService.encrypt({
  patientData: sensitiveInformation,
  algorithm: 'AES-256-GCM',
  key: process.env.ENCRYPTION_KEY,
});

// Example: Audit logging
await auditLogger.log({
  action: 'PATIENT_DATA_ACCESS',
  userId: user.id,
  clientId: user.clientId,
  resourceId: patient.id,
  timestamp: new Date(),
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

### **🛡️ Security Middleware**

#### **Rate Limiting**

```typescript
// Prevent brute force attacks
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### **Input Validation**

```typescript
// Sanitize and validate all inputs
const medicationSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  dosage: z.string().regex(/^\d+(\.\d+)?\s*(mg|g|ml|units?)$/i),
  instructions: z.string().max(500).trim(),
  clientId: z.string().uuid(),
});
```

#### **SQL Injection Prevention**

```typescript
// Prisma ORM provides automatic SQL injection protection
const medications = await prisma.medication_master.findMany({
  where: {
    clientId: clientId, // Automatically sanitized
    name: {
      contains: searchTerm, // Safe parameterized query
      mode: 'insensitive',
    },
  },
});
```

### **🔍 Security Monitoring**

#### **Real-time Threat Detection**

- **Suspicious Login Attempts**: Geographic anomalies, impossible travel
- **Data Access Patterns**: Unusual bulk data access
- **API Abuse**: Excessive requests, endpoint scanning
- **Data Exfiltration**: Large data downloads, bulk exports

#### **Security Headers**

```typescript
// Implemented security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

### **🔐 Multi-Tenant Security**

Every data operation is automatically scoped to the appropriate tenant:

```typescript
// Example: Automatic tenant isolation
class MedicationRepository {
  async findByClientId(clientId: string) {
    return await this.prisma.medication_master.findMany({
      where: {
        clientId: clientId, // Tenant isolation enforced
        isActive: true,
      },
    });
  }

  async create(data: CreateMedicationDto, clientId: string) {
    return await this.prisma.medication_master.create({
      data: {
        ...data,
        clientId: clientId, // Always include tenant context
        modUser: getCurrentUser().id,
      },
    });
  }
}
```

### **📋 Security Checklist**

- ✅ **Authentication**: OAuth 2.0 with JWT tokens
- ✅ **Authorization**: Role-based access control (RBAC)
- ✅ **Data Encryption**: AES-256 at rest, TLS 1.3 in transit
- ✅ **Input Validation**: Comprehensive input sanitization
- ✅ **SQL Injection Prevention**: Parameterized queries via Prisma
- ✅ **XSS Prevention**: Content Security Policy headers
- ✅ **CSRF Protection**: Token-based CSRF protection
- ✅ **Rate Limiting**: Request throttling and IP-based limits
- ✅ **Audit Logging**: Comprehensive security event logging
- ✅ **Multi-Tenant Isolation**: Complete data segregation
- ✅ **Security Headers**: Helmet.js security headers
- ✅ **Environment Security**: Secure environment variable handling
