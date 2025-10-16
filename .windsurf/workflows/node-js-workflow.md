---
description: workflow for node js
auto_execution_mode: 1
---

# 🐳 NestJS + TypeORM + Docker Workflow Guide
but since this is using prisma, use prisma instead

This document describes a complete backend development workflow for **NestJS** + **TypeORM**, running fully inside **Docker** containers.  
It includes setup, local development, migrations, testing, and production deployment.

---

## 🧱 1. Tech Stack

| Component | Description |
|------------|-------------|
| **NestJS** | Node.js framework for scalable server applications |
| **TypeORM** | ORM for database models and migrations |
| **PostgreSQL** | Main database |
| **Docker + Docker Compose** | Containerization and service orchestration |
| **pnpm** | Fast package manager |
| **ESLint + Prettier** | Linting and code formatting |
| **Jest** | Unit and integration testing |

---

## 🗂️ 2. Project Structure

.
├── src/
│ ├── app.module.ts
│ ├── main.ts
│ ├── modules/
│ │ ├── user/
│ │ │ ├── user.module.ts
│ │ │ ├── user.service.ts
│ │ │ ├── user.controller.ts
│ │ │ └── user.entity.ts
│ │ └── ...
│ ├── config/
│ │ ├── app.config.ts
│ │ └── database.config.ts
│ └── database/
│ ├── migrations/
│ └── seeds/
├── test/
├── .env
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json

# .env
# Application
PORT=3000

# Database (for Docker)
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/nestjs_db?schema=public"

# Database credentials
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nestjs_db

# JWT Authentication
JWT_SECRET=change-this-to-a-secure-random-string-in-production
JWT_EXPIRES_IN=1d
