import { Pool, PoolClient } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5434"),
  user: process.env.DB_USER || "user_ticketing_app",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "db_ticketing",
});

// Log connection info for debugging (without password)
console.log(`[Database] Attempting to connect to ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

// Handle pool errors
pool.on("error", (err) => {
  console.error("[Database] Unexpected error on idle client:", err);
});

pool.on("connect", () => {
  console.log("[Database] Successfully connected to PostgreSQL");
});

export async function query(text: string, params: any[] = []) {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error("[Database] Query error:", error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

export default pool;
