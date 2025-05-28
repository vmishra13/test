# Reliacare Backend API

A robust healthcare sector backend application built with **Express.js** and **TypeScript**.

---

## 📁 Project Directory Structure (Vertically Sliced)

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

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Available Scripts

- `pnpm build`: Build the project
- `pnpm start`: Run the built project
- `pnpm dev`: Start development server with hot-reload
- `pnpm lint`: Run ESLint
- `pnpm lint:fix`: Fix ESLint issues
- `pnpm format`: Format code with Prettier
