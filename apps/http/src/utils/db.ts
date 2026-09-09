import { createDatabase } from "@agent-platform/db/client";
import { env } from "../../env";

export const db = createDatabase(env.DATABASE_URL);
