# S/R/E Platform — Production Deployment

## 🚀 One-Command Deploy to Vercel + Turso (Free)

```bash
bash scripts/deploy-complete.sh
```

This will:
1. Set up a free Turso cloud database
2. Deploy to Vercel's free tier
3. Seed the production database
4. Verify the deployment

## 📋 Prerequisites

- [Vercel account](https://vercel.com/signup) (free)
- [Turso account](https://turso.tech/signup) (free tier: 9GB, 25M reads/month)
- Node.js 18+ or Bun

## 🔧 Manual Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed step-by-step instructions.

## 🌐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Turso: `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | ✅ | Turso auth token |
| `NEXTAUTH_SECRET` | ✅ | Random secret for JWT signing |
| `NEXTAUTH_URL` | ✅ | Your production URL |

## 📁 Project Structure

- `scripts/setup-turso.sh` — Turso database setup
- `scripts/deploy-vercel.sh` — Vercel deployment
- `scripts/deploy-complete.sh` — Full deployment orchestration
- `scripts/seed-production.sh` — Production database seeding
- `scripts/run-production.sh` — Local production server runner
- `.github/workflows/deploy.yml` — CI/CD pipeline

## 🏗️ Architecture

- **Framework**: Next.js 16 (standalone output)
- **Database**: SQLite (local) / Turso (production)
- **ORM**: Prisma 6 with libSQL driver adapter
- **Auth**: NextAuth v4 (credentials-based)
- **Hosting**: Vercel (recommended) / Any Node.js host
