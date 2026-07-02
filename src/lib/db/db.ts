import { Pool, QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set in your environment as a PostgreSQL connection string.",
  );
}

if (!/^postgres(?:ql)?:\/\//i.test(connectionString)) {
  throw new Error(
    `DATABASE_URL must be a Postgres URL, e.g. postgres://user:password@localhost:5432/dbname. Got: ${connectionString}`,
  );
}

export const pool = new Pool({ connectionString });

pool.on("error", (error: Error) => {
  console.error("Postgres pool error:", error);
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "user" (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      adresse TEXT NOT NULL,
      telephone TEXT,
      ville TEXT,
      pays TEXT,
      code_postal TEXT,
      note TEXT,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      specialite TEXT DEFAULT 'Autre',
      emailVerified BOOLEAN NOT NULL DEFAULT false,
      image TEXT,
      createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS machines (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      assigned_to INTEGER REFERENCES "user"(id),
      number_ligne TEXT,
      product TEXT,
      version TEXT,
      service_date TEXT,
      tel_pilote TEXT,
      technician_name TEXT,
      tel_technician TEXT,
      note TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      machine_id INTEGER REFERENCES machines(id),
      priority TEXT DEFAULT 'Normal',
      status TEXT DEFAULT 'Ouvert',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      created_by INTEGER REFERENCES "user"(id),
      assigned_to INTEGER REFERENCES "user"(id),
      type TEXT DEFAULT 'Inconnu'
    );
  `);
}

const initPromise = initDatabase().catch((error) => {
  console.error("Database initialization failed:", error);
  throw error;
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  await initPromise;
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  const rows = await query<T>(text, params);
  return rows[0];
}
