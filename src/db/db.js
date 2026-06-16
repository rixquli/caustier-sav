import path from "path";
import Database from "better-sqlite3";
import { hashPassword, isHashedPassword } from "@/lib/password";

const dbPath = path.join(process.cwd(), "profile.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now')),
    phone TEXT,
    note TEXT
  );
`);

function upsertSeedUser(nom, email, plainPassword, role) {
  const hashedPassword = hashPassword(plainPassword);
  const existing = db
    .prepare("SELECT id, password FROM users WHERE email = ?")
    .get(email);

  if (!existing) {
    db.prepare(
      "INSERT INTO users (nom, email, password, role) VALUES (?, ?, ?, ?)",
    ).run(nom, email, hashedPassword, role);
    return;
  }

  if (!isHashedPassword(existing.password)) {
    db.prepare(
      "UPDATE users SET nom = ?, password = ?, role = ? WHERE email = ?",
    ).run(nom, hashedPassword, role, email);
  }
}

upsertSeedUser("Admin", "admin@caustier.fr", "admin123", "admin");
upsertSeedUser("Client Demo", "client@caustier.fr", "client123", "client");

export function findUserByEmail(email) {
  return db
    .prepare("SELECT id, nom, email, password, role FROM users WHERE email = ?")
    .get(email);
}

export function findUserById(id) {
  return db
    .prepare("SELECT id, nom, email, role FROM users WHERE id = ?")
    .get(id);
}
