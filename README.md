# LLsystem

Chinese vocabulary learning app for Vietnamese speakers. Uses spaced repetition (SM-2) to schedule reviews.

Each word includes pinyin, hán việt, and Vietnamese definition — sourced from CC-CEDICT + CVDICT, ~125,000 entries.

## Stack

- **Backend** — NestJS · TypeORM · PostgreSQL
- **Frontend** — Next.js 14 · Ant Design · next-intl
- **Auth** — JWT · email verification via Gmail SMTP

## Getting started

**Requirements:** Node.js 20+

```bash
# backend
cd backend-official
npm install
cp .env.example .env   # fill in values below
npm run dev            # http://localhost:8080

# frontend
cd frontend
npm install
cp .env.example .env
npm run dev            # http://localhost:3000
```

### backend-official/.env

```env
PORT=8080

DB_HOST=
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=
JWT_ACCESS_TOKEN_EXPIRED=1d

MAIL_USER=
MAIL_PASSWORD=
```

### frontend/.env

```env
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```
