import Database from "better-sqlite3";

export const dbFilePathName = "./database.db";

const db = new Database(dbFilePathName);
db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        adresse TEXT NOT NULL,
        telephone TEXT,
        ville TEXT,
        pays TEXT,
        code_postal TEXT,
        note TEXT
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
        FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        machine_id INTEGER,
        priority TEXT DEFAULT 'Normal',
        status TEXT DEFAULT 'Ouvert',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        assigned_to INTEGER,
        FOREIGN KEY (machine_id) REFERENCES machines(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
    );
`);
