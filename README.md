# Reliacare Backend API

A robust healthcare sector backend application built with **Express.js** and **TypeScript**.

---

## 📁 Project Directory Structure Example (Vertically Sliced)

A scalable and maintainable directory structure using feature-based modular organization.

<pre>
src/
├── config/                  # Application configuration
│   ├── database.ts
│   ├── env.ts
│   ├── logger.ts
│   └── index.ts
│
├── features/                # Feature modules (vertical slices)
│   ├── auth/                # Authentication and authorization
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dto/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes.ts
│   │   └── index.ts
│   ├── users/               # User management
│   ├── patients/            # Patient information
│   ├── appointments/        # Appointment scheduling
│   ├── medical-records/     # Medical records management
│   └── billing/             # Billing and payments
│
├── shared/                  # Shared resources
│   ├── constants/           # Application constants
│   ├── decorators/          # TypeScript decorators
│   ├── errors/              # Custom error classes
│   ├── interfaces/          # TypeScript interfaces
│   ├── middlewares/         # Common middleware
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── validators/          # Data validators
│
├── app.ts                   # Express application setup
├── index.ts                 # Application entry point
└── routes.ts                # API routes configuration
</pre>

## 🧩 Design Highlights

- **Vertical slices**: Each feature folder (e.g. `auth`, `users`) encapsulates its own routes, services, models, etc.
- **Shared layer**: The `shared/` directory holds utilities and code reused across features.
- **Config separation**: Cleanly organizes environment settings, database, and logging logic in `/config`.

## Code Style and Conventions

### Naming Conventions

- **Files and Folders**: lowercase with hyphens (kebab-case)
- **Classes**: PascalCase
- **Interfaces**: PascalCase with "I" prefix (e.g., IUser)
- **Types**: PascalCase
- **Functions/Methods**: camelCase
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE

### Refactoring Policy

1. **When to Refactor**:

   - Duplicate code detected (violation of DRY)
   - Functions/classes growing too large (violation of SRP)
   - Excessive complexity
   - Before adding new features to related code

2. **Refactoring Approach**:
   - Write tests first (if not already covered)
   - Make small, incremental changes
   - Commit after each successful refactoring step
   - Review changes to ensure functionality is preserved

## Engineering Principles

This project follows these core engineering principles:

### DRY (Don't Repeat Yourself)

- Avoid code duplication by creating reusable components
- Centralize common logic in shared services and utilities
- Use abstractions to encapsulate repeated patterns

### SRP (Single Responsibility Principle)

- Each module, class, and function should have one focused responsibility
- Classes should have only one reason to change
- Keep components small and focused on specific tasks

### KISS (Keep It Simple, Stupid)

- Prefer straightforward implementations over complex solutions
- Avoid over-engineering and premature optimizations
- Choose readability over cleverness

### YAGNI (You Aren't Gonna Need It)

- Only implement features when they're required
- Avoid speculative functionality
- Focus on current requirements rather than potential future ones

These principles guide our code organization, architecture decisions, and review processes.

## Development

## 📋 **Prerequisites**

### **1. Install Node.js**

- **Download and install Node.js v18 or higher** from [nodejs.org](https://nodejs.org/)
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

### **2. Install pnpm Package Manager**

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

**Alternative installation methods:**

```bash
# Using npm
npm install -g pnpm@10.10.0

# Using Homebrew (macOS)
brew install pnpm

# Using Chocolatey (Windows)
choco install pnpm

# Using Scoop (Windows)
scoop install pnpm
```

## 🚀 **Project Setup**

### **1. Clone Repository**

```bash
# Clone from AWS CodeCommit
git clone https://git-codecommit.us-west-2.amazonaws.com/v1/repos/reliacare-backend

# Navigate to project directory
cd reliacare-backend
```

### **2. Install Dependencies**

```bash
# Install all project dependencies
pnpm install
```

### **3. Environment Configuration**

```bash
# Copy environment template (if available)
cp .env.example .env

# Or create .env file with required variables
```

### **4. Generate Prisma Clients**

```bash
# Generate both PostgreSQL and MongoDB Prisma clients
pnpm generate
```

### **5. Start Development Server**

```bash
# Start server in development mode with auto-reload
pnpm dev

# Server will start at http://localhost:3000
```

## 🔧 **Available Scripts**

### **Development Scripts**

```bash
# Start development server with hot reload
pnpm dev

# Build TypeScript to JavaScript
pnpm build

# Start production server
pnpm start
```

### **Database Scripts**

```bash
# Generate Prisma clients for both databases
pnpm generate

# Generate PostgreSQL client only
pnpm generate:postgres

# Generate MongoDB client only
pnpm generate:mongodb

# Pull schema from databases
pnpm pull

# Clean generated clients
pnpm db:clean

# Full database sync (pull + generate)
pnpm db:sync
```

### **Database Management**

```bash
# Open Prisma Studio for PostgreSQL
pnpm studio:postgres

# Open Prisma Studio for MongoDB
pnpm studio:mongodb
```

## 🗄️ **Database Schema Management Guide**

Understanding when and how to use database scripts is crucial for maintaining consistency across development environments.

### **When to Use `pnpm pull:postgres`**

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

# Then regenerate the client
pnpm generate:postgres
```

### **When to Use `pnpm generate:postgres`**

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

### **Common Workflow Patterns**

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

### **⚠️ Important Notes**

- **Always run `generate` after `pull`** - pulling updates the schema file, but doesn't update the TypeScript client
- **Check `.env` file** - ensure database URLs are correct before pulling
- **Commit schema changes** - if `pull` modifies your schema file, commit those changes
- **CI/CD environments** - always run `pnpm generate` in build pipelines

## ⚡ **Quick Start**

```bash
# 1. Clone repository
git clone https://git-codecommit.us-west-2.amazonaws.com/v1/repos/reliacare-backend
cd reliacare-backend

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env  # Configure your database URLs

# 4. Generate Prisma clients
pnpm generate

# 5. Start development server
pnpm dev
```

🎉 **Your server is now running at http://localhost:3000**
