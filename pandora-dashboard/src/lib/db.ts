import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function getDbUrl(): string {
  if (process.env.VERCEL) {
    const tmpDb = "/tmp/dev.db";
    if (!fs.existsSync(tmpDb)) {
      const srcDb = path.join(process.cwd(), "prisma", "dev.db");
      fs.copyFileSync(srcDb, tmpDb);
    }
    return `file:${tmpDb}`;
  }
  return process.env.DATABASE_URL || "file:./dev.db";
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: { db: { url: getDbUrl() } },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
