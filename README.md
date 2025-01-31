# CRUD Generator TS

A CRUD generator for TypeScript applications using Express and TypeORM.

## Installation

```bash
npm install -g crud-generator-ts
```

## Usage

```bash
generate-crud <resource-name>
```

## Example

```bash
generate-crud userType
```

This command will generate:
- Entity (user-type.ts)
- Controller (user-type-controller.ts)
- Repository (user-type-repository.ts)
- Routes (user-type.routes.ts)

## Recommended Directory Structure

```
your-project
├── src/
│   ├── infra/
│   │   ├── database/
│   │   │   └── main.ts
│   │   └── entity/
│   │       ├── index.ts
│   │       └── user-type.ts
│   ├── controllers/
│   │   └── user-type-controller.ts
│   ├── repositories/
│   │   └── user-type-repository.ts
│   └── routes/
│       ├── index.ts
│       └── user-type.routes.ts
├── package.json
└── tsconfig.json
```

## Prerequisites

Your application must have:
- Configured TypeORM
- Configured Express
- Configured TypeScript
- A database configuration file (src/infra/database/main.ts)
- An authentication middleware (isAuthenticated)

## Generated Files

### Entity
- Base class with common fields (ID, created/updated user and timestamp)
- Decoradores TypeORM
- Schema configurável via variável de ambiente

### Controller
- Basic CRUD with methods:
  - getAll()
  - getById()
  - create()
  - update()
  - delete()
- TSOA decorators for documentation

### Repository
- Methods for database operations:
  - findAll()
  - findById()
  - create()
  - update()
  - deleteById()

### Routes
- REST endpoints:
  - GET /
  - GET /:id
  - POST /
  - PUT /:id
  - DELETE /:id



