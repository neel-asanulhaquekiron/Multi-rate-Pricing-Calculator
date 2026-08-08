import { PrismaClient } from "@prisma/client";

// One PrismaClient per process. In dev, tsx watch re-imports modules on save —
// cache the client on globalThis so restarts don't leak connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
