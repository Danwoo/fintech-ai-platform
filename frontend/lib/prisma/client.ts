import { env } from "@/env";
import { PrismaClient } from "@/prisma/generated/client";
import { PrismaMssql } from "@prisma/adapter-mssql";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaMssql(url);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
