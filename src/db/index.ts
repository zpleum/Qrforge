import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// HTTP driver = no connection pool to exhaust on serverless. One query = one fetch.
export const db = drizzle(process.env.DATABASE_URL!, { schema });
