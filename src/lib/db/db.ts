import Database from "better-sqlite3";
import path from "path";

export const dbFilePathName = path.join(process.cwd(), "database.db");

export const db = new Database(dbFilePathName);
db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        specialite TEXT DEFAULT 'Autre'
    );

    CREATE TABLE IF NOT EXISTS machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        assigned_to INTEGER,
        number_ligne TEXT,
        product TEXT,
        version TEXT,
        service_date TEXT,
        tel_pilote TEXT,
        technician_name TEXT,
        tel_technician TEXT,
        note TEXT,
        FOREIGN KEY (assigned_to) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        machine_id INTEGER,
        priority TEXT DEFAULT 'Normal',
        status TEXT DEFAULT 'Ouvert',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        assigned_to INTEGER,
        type TEXT DEFAULT 'Inconnu',
        FOREIGN KEY (machine_id) REFERENCES machines(id),
        FOREIGN KEY (assigned_to) REFERENCES user(id),
        FOREIGN KEY (created_by) REFERENCES user(id)
    );
`);

// --- Migration automatique : ajoute les colonnes manquantes ---
function addColumnIfNotExists(
  table: string,
  column: string,
  definition: string,
) {
  const existingColumns = db.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];

  const columnExists = existingColumns.some((col) => col.name === column);

  if (!columnExists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Colonne "${column}" ajoutée à la table "${table}"`);
  }
}

// --- Colonnes requises par Better Auth sur la table user ---
// addColumnIfNotExists("user", "emailVerified", "BOOLEAN NOT NULL DEFAULT false");
// addColumnIfNotExists("user", "image", "TEXT");
// addColumnIfNotExists(
//   "user",
//   "createdAt",
//   "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
// );
// addColumnIfNotExists(
//   "user",
//   "updatedAt",
//   "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
// );

// Exemple : si t'ajoutes d'autres colonnes plus tard
// addColumnIfNotExists("machines", "note", "TEXT");
// addColumnIfNotExists("tickets", "type", "TEXT DEFAULT 'Inconnu'");
