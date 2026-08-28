import { PrismaClient } from "@prisma/client"

/**
 * Prisma Client Singleton Pattern for Serverless
 *
 * Uses a global variable to avoid creating multiple PrismaClient instances,
 * which would exhaust the connection pool in Vercel Serverless Functions.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const prismaClientSingleton = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default prisma
