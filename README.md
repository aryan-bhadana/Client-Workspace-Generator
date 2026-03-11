# Client Workspace Generator

Production-ready scaffold for a Micro-SaaS that provisions client workspaces across Google Drive and Notion.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ShadCN UI conventions
- Prisma + PostgreSQL
- Supabase Auth
- Vercel-ready deployment target

## Getting Started

1. Install dependencies with your package manager of choice.
2. Copy `.env.example` to `.env` and fill in the values.
3. Run `prisma generate`.
4. Run your first migration with `prisma migrate dev`.
5. Start the app with `npm run dev`.

## Structure

- `app`: route tree and layouts
- `components`: UI and feature components
- `lib`: shared utilities, env parsing, database, auth clients
- `services`: application services
- `api`: API-layer placeholders
- `integrations`: future provider orchestration
- `prisma`: Prisma schema
- `types`: shared TypeScript contracts
