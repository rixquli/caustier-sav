import { getDb } from "./db.js";
import type {
  CreateTechnicienInput,
  CreateTechnicienNoteInput,
  ListTechniciansParams,
  TechnicienDisplay,
  TechnicienId,
  TechnicienNoteRow,
  TechnicienRow,
  UpdateTechnicienInput,
} from "@/types/technicien";

function parseTechnicienId(id: TechnicienId): number {
  return typeof id === "number" ? id : Number(id);
}

export function formatTechnicienDisplay(
  row: TechnicienRow | null | undefined,
): TechnicienDisplay | null {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    specialite: row.specialite,
    email: row.email,
    telephone: row.telephone,
    phone_number: row.telephone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notes: row.notes_technicien,
    notes_admin: row.notes_technicien,
    displayName: row.name,
  };
}

export function createTechnician(
  input: CreateTechnicienInput,
): TechnicienRow | undefined {
  const db = getDb();
  const notes = input.notes?.trim() || null;

  const result = db
    .prepare(
      `INSERT INTO techniciens (name, specialite, telephone, email, notes_technicien)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      input.name.trim(),
      input.specialite?.trim() ?? "",
      input.phone?.trim() ?? "",
      input.email.trim(),
      notes,
    );

  return db
    .prepare("SELECT * FROM techniciens WHERE id = ?")
    .get(result.lastInsertRowid) as TechnicienRow | undefined;
}

export function updateTechnician(
  id: TechnicienId,
  data: UpdateTechnicienInput,
): TechnicienRow | null {
  const existing = getTechnicianById(id);
  if (!existing) return null;

  const db = getDb();
  const name = data.name ?? existing.name;
  const specialite = data.specialite ?? existing.specialite;
  const telephone =
    data.phone ?? data.phone_number ?? existing.telephone ?? "";
  const email = data.email ?? existing.email;
  const notes_technicien =
    data.notes_technicien !== undefined
      ? data.notes_technicien
      : existing.notes_technicien;

  db.prepare(
    `UPDATE techniciens
     SET name = ?, specialite = ?, telephone = ?, email = ?, notes_technicien = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
  ).run(name, specialite, telephone, email, notes_technicien, parseTechnicienId(id));

  return getTechnicianById(id) ?? null;
}

export function deleteTechnician(id: TechnicienId): TechnicienRow | null {
  const existing = getTechnicianById(id);
  if (!existing) return null;

  getDb()
    .prepare("DELETE FROM techniciens WHERE id = ?")
    .run(parseTechnicienId(id));

  return existing;
}

export function listTechnicians({
  search = "",
}: ListTechniciansParams = {}): TechnicienRow[] {
  const db = getDb();
  let sql = "SELECT * FROM techniciens WHERE 1=1";
  const params: string[] = [];

  if (search.trim()) {
    sql += " AND (name LIKE ? OR email LIKE ? OR telephone LIKE ?)";
    const query = `%${search.trim()}%`;
    params.push(query, query, query);
  }

  sql += " ORDER BY created_at DESC";
  return db.prepare(sql).all(...params) as TechnicienRow[];
}

export function getTechnicianById(
  id: TechnicienId,
): TechnicienRow | undefined {
  return getDb()
    .prepare("SELECT * FROM techniciens WHERE id = ?")
    .get(parseTechnicienId(id)) as TechnicienRow | undefined;
}

export function getTechnicianBySpecialite(
  specialite: string,
): TechnicienRow | undefined {
  return getDb()
    .prepare("SELECT * FROM techniciens WHERE specialite = ?")
    .get(specialite) as TechnicienRow | undefined;
}

export function listTechnicianNotes(
  technicienId: TechnicienId,
): TechnicienNoteRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM technicien_notes
       WHERE technicien_id = ?
       ORDER BY created_at DESC`,
    )
    .all(String(technicienId)) as TechnicienNoteRow[];
}

export function createTechnicianNote(
  input: CreateTechnicienNoteInput,
): TechnicienNoteRow {
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO technicien_notes (technicien_id, contenu) VALUES (?, ?)",
    )
    .run(String(input.technicien_id), input.contenu);

  return db
    .prepare("SELECT * FROM technicien_notes WHERE id = ?")
    .get(result.lastInsertRowid) as TechnicienNoteRow;
}
