import Database from "better-sqlite3";

export const dbFilePathName = "./database.db";

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
        is_admin BOOLEAN NOT NULL DEFAULT false
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
        FOREIGN KEY (machine_id) REFERENCES machines(id),
        FOREIGN KEY (assigned_to) REFERENCES user(id),
        FOREIGN KEY (created_by) REFERENCES user(id)
    );
`);
