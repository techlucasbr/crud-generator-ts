# CRUD Generator TS

A CRUD generator for TypeScript applications using Express and TypeORM.

## Installation

```bash
npm install -g crud-generator-ts
```

## Usage

```bash
generate-crud <nome-do-recurso>
```

## Example

```bash
generate-crud User
```

This command will generate:
- Entity
- Controller
- Repository
- Routes

## Recommended Directory Structure

```
your-project
├── src/
│   ├── infra/
│   │   ├── database/
│   │   │   └── main.ts
│   │   └── entity/
│   │       ├── index.ts
│   │       └── user.ts
│   ├── controllers/
│   │   └── user-controller.ts
│   ├── repositories/
│   │   └── user-repository.ts
│   └── routes/
│       ├── index.ts
│       └── user.routes.ts
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



