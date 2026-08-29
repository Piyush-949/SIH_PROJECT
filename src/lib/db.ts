import { PrismaClient } from "@prisma/client";
import path from "path";

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.startsWith("file:")) {
    return envUrl;
  }

  if (envUrl && envUrl.startsWith("file:")) {
    const rawPath = envUrl.replace("file:", "");
    if (path.isAbsolute(rawPath)) {
      return envUrl;
    }
    const cleaned = rawPath.replace(/^\.\//, "");
    if (cleaned.startsWith("prisma/")) {
      return `file:${path.resolve(process.cwd(), cleaned)}`;
    }
    return `file:${path.resolve(process.cwd(), "prisma", cleaned)}`;
  }

  return `file:${path.resolve(process.cwd(), "prisma", "dev.db")}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;
