import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../generated/client";

export { Prisma };

export function createDatabase(databaseUrl: string) {
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });
  return new PrismaClient({
    adapter,
  });
}

export type Database = ReturnType<typeof createDatabase>;
