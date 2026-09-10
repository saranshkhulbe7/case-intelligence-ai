import { createDatabase } from "@case-intelligence/db/client";
import { env } from "../../env";

export const db = createDatabase(env.DATABASE_URL);
