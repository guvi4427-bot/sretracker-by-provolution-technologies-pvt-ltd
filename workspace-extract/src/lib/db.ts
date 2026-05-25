import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  // Detect if using Turso (libsql:// protocol) vs local SQLite (file: protocol)
  if (databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('http://') || databaseUrl.startsWith('https://')) {
    // Turso / remote libSQL connection
    const adapter = new PrismaLibSql({
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN || '',
    })
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    })
  }

  // Local SQLite file connection (development / fallback)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
