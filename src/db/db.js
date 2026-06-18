import path from "path";
import Database from "better-sqlite3";

const dbPath = path.join(process.cwd(), "profile.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS machines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    nom TEXT NOT NULL,
    marque TEXT,
    produits_calibres TEXT,
    version_logiciel TEXT,
    date_mise_en_service TEXT,
    pilote_ligne TEXT,
    technicien_charge TEXT,
    nombre_lignes INTEGER,
    serveurs_vision TEXT,
    notes_internes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS demandes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    machine_id INTEGER,
    titre TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    priorite TEXT NOT NULL DEFAULT 'normale',
    status TEXT NOT NULL DEFAULT 'nouvelle',
    assigned_to TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    last_activity_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT,
    closed_at TEXT,
    read_by_client INTEGER NOT NULL DEFAULT 0,
    read_by_admin INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    demande_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    contenu TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS demande_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    demande_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    contenu TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS client_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    admin_id TEXT NOT NULL,
    contenu TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS demande_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    demande_id INTEGER NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    is_public INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS faq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    reponse TEXT NOT NULL,
    categorie TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS faq_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faq_id INTEGER NOT NULL,
    user_id TEXT,
    question TEXT NOT NULL,
    reponse TEXT NOT NULL,
    categorie TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (faq_id) REFERENCES faq(id) ON DELETE CASCADE
  );
`);

export function ensureExtraColumns() {
  // notes_admin on user (Better Auth additionalFields handles it on fresh DB,
  // but ALTER TABLE is needed for existing DBs that were created before this field)
  const userCols = db.prepare("PRAGMA table_info(user)").all();
  if (userCols.length > 0 && !userCols.some((c) => c.name === "notes_admin")) {
    db.exec("ALTER TABLE user ADD COLUMN notes_admin TEXT");
  }

  // notes_admin on demandes
  const demandeCols = db.prepare("PRAGMA table_info(demandes)").all();
  if (demandeCols.length > 0 && !demandeCols.some((c) => c.name === "notes_admin")) {
    db.exec("ALTER TABLE demandes ADD COLUMN notes_admin TEXT");
  }
}

function migrateLegacyData() {
  ensureExtraColumns();

  const demandeCols = db.prepare("PRAGMA table_info(demandes)").all();
  if (demandeCols.length === 0) return;

  const hasMachineCol = demandeCols.some((c) => c.name === "machine");
  if (hasMachineCol) {
    db.exec(`
      UPDATE demandes SET type = 'SAV' WHERE type IN ('panne', 'maintenance', 'installation', 'devis');
      UPDATE demandes SET type = 'AUTRE' WHERE type = 'autre';
      UPDATE demandes SET priorite = 'faible' WHERE priorite = 'basse';
      UPDATE demandes SET priorite = 'critique' WHERE priorite = 'urgente';
      UPDATE demandes SET status = 'nouvelle' WHERE status = 'ouverte';
    `);
  }
}

migrateLegacyData();

export function findAppUserById(id) {
  return db
    .prepare(
      `SELECT id, name, email, emailVerified, image, createdAt, updatedAt,
              role, nom, prenom, phone, adresse, archived, mustChangePassword, notes_admin
       FROM user WHERE id = ?`,
    )
    .get(id);
}

export function findAppUserByEmail(email) {
  return db
    .prepare(
      `SELECT id, name, email, role, nom, prenom, phone, adresse, archived, mustChangePassword
       FROM user WHERE email = ?`,
    )
    .get(email);
}

export function listClients({ search = "", includeArchived = false } = {}) {
  let sql = `SELECT id, name, email, role, nom, prenom, phone, adresse, archived, mustChangePassword, createdAt
             FROM user WHERE role = 'client'`;
  const params = [];

  if (!includeArchived) {
    sql += " AND (archived = 0 OR archived IS NULL)";
  }

  if (search.trim()) {
    sql +=
      " AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR name LIKE ? OR phone LIKE ?)";
    const q = `%${search.trim()}%`;
    params.push(q, q, q, q, q);
  }

  sql += " ORDER BY nom COLLATE NOCASE, prenom COLLATE NOCASE";
  return db.prepare(sql).all(...params);
}

export function listAdmins() {
  return db
    .prepare(
      `SELECT id, name, nom, prenom, email FROM user WHERE role = 'admin' ORDER BY nom, name`,
    )
    .all();
}

export function updateAppUser(id, fields) {
  const allowed = [
    "nom",
    "prenom",
    "phone",
    "adresse",
    "archived",
    "mustChangePassword",
    "name",
    "notes_admin",
  ];
  const sets = [];
  const values = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  if (sets.length === 0) return findAppUserById(id);

  values.push(id);
  db.prepare(`UPDATE user SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return findAppUserById(id);
}

export function formatUserDisplay(user) {
  if (!user) return null;
  const nom = user.nom || user.name?.split(" ").slice(1).join(" ") || "";
  const prenom = user.prenom || user.name?.split(" ")[0] || "";
  return {
    ...user,
    nom,
    prenom,
    displayName:
      [prenom, nom].filter(Boolean).join(" ") || user.name || user.email,
  };
}

export function listMachinesForUser(userId) {
  return db
    .prepare(
      "SELECT * FROM machines WHERE user_id = ? ORDER BY nom COLLATE NOCASE",
    )
    .all(userId);
}

export function getMachineById(id) {
  return db.prepare("SELECT * FROM machines WHERE id = ?").get(id);
}

export function createMachine(userId, data) {
  const result = db
    .prepare(
      `INSERT INTO machines (user_id, nom, marque, produits_calibres, version_logiciel,
        date_mise_en_service, pilote_ligne, technicien_charge, nombre_lignes, serveurs_vision, notes_internes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      userId,
      data.nom,
      data.marque ?? null,
      data.produits_calibres ?? null,
      data.version_logiciel ?? null,
      data.date_mise_en_service ?? null,
      data.pilote_ligne ?? null,
      data.technicien_charge ?? null,
      data.nombre_lignes ?? null,
      data.serveurs_vision ?? null,
      data.notes_internes ?? null,
    );
  return getMachineById(result.lastInsertRowid);
}

export function updateMachine(id, data) {
  db.prepare(
    `UPDATE machines SET nom = ?, marque = ?, produits_calibres = ?, version_logiciel = ?,
      date_mise_en_service = ?, pilote_ligne = ?, technicien_charge = ?, nombre_lignes = ?,
      serveurs_vision = ?, notes_internes = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(
    data.nom,
    data.marque ?? null,
    data.produits_calibres ?? null,
    data.version_logiciel ?? null,
    data.date_mise_en_service ?? null,
    data.pilote_ligne ?? null,
    data.technicien_charge ?? null,
    data.nombre_lignes ?? null,
    data.serveurs_vision ?? null,
    data.notes_internes ?? null,
    id,
  );
  return getMachineById(id);
}

export function deleteMachine(id) {
  return db.prepare("DELETE FROM machines WHERE id = ?").run(id);
}

export function touchDemandeActivity(demandeId) {
  db.prepare(
    "UPDATE demandes SET last_activity_at = datetime('now') WHERE id = ?",
  ).run(demandeId);
}

export function logActivity({
  demandeId,
  userId,
  action,
  details = null,
  isPublic = true,
}) {
  db.prepare(
    `INSERT INTO demande_activity (demande_id, user_id, action, details, is_public)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    demandeId,
    userId ?? null,
    action,
    details ? JSON.stringify(details) : null,
    isPublic ? 1 : 0,
  );
  touchDemandeActivity(demandeId);
}

export function listActivityForDemande(demandeId, publicOnly = false) {
  const sql = publicOnly
    ? `SELECT a.*, u.nom AS user_nom, u.prenom AS user_prenom, u.name AS user_name, u.role AS user_role
       FROM demande_activity a
       LEFT JOIN user u ON u.id = a.user_id
       WHERE a.demande_id = ? AND a.is_public = 1
       ORDER BY a.created_at ASC`
    : `SELECT a.*, u.nom AS user_nom, u.prenom AS user_prenom, u.name AS user_name, u.role AS user_role
       FROM demande_activity a
       LEFT JOIN user u ON u.id = a.user_id
       WHERE a.demande_id = ?
       ORDER BY a.created_at ASC`;

  return db.prepare(sql).all(demandeId);
}

const DEMANDE_SELECT = `
  SELECT d.*,
         u.nom AS client_nom, u.prenom AS client_prenom, u.name AS client_name,
         u.email AS client_email, u.phone AS client_phone, u.adresse AS client_adresse,
         u.notes_admin AS client_notes_admin,
         a.nom AS assignee_nom, a.prenom AS assignee_prenom, a.name AS assignee_name,
         m.nom AS machine_nom
  FROM demandes d
  JOIN user u ON u.id = d.user_id
  LEFT JOIN user a ON a.id = d.assigned_to
  LEFT JOIN machines m ON m.id = d.machine_id
`;

export function getDemandeById(id) {
  return db.prepare(`${DEMANDE_SELECT} WHERE d.id = ?`).get(id);
}

export function listDemandesForUser(userId) {
  return db
    .prepare(`${DEMANDE_SELECT} WHERE d.user_id = ? ORDER BY d.created_at DESC`)
    .all(userId);
}

export function listAllDemandes() {
  return db.prepare(`${DEMANDE_SELECT} ORDER BY d.created_at DESC`).all();
}

export function createDemande({
  userId,
  machineId,
  titre,
  description,
  type,
  priorite,
  assignedTo,
  actorId,
}) {
  const result = db
    .prepare(
      `INSERT INTO demandes (user_id, machine_id, titre, description, type, priorite, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      userId,
      machineId ?? null,
      titre,
      description,
      type,
      priorite,
      assignedTo ?? null,
    );

  const demande = getDemandeById(result.lastInsertRowid);
  logActivity({
    demandeId: demande.id,
    userId: actorId,
    action: "creation",
    details: { titre, type, priorite },
    isPublic: true,
  });
  return demande;
}

export function updateDemande(id, fields, actorId) {
  const existing = getDemandeById(id);
  if (!existing) return null;

  const updates = {};
  const trackFields = [
    "titre",
    "description",
    "type",
    "priorite",
    "status",
    "assigned_to",
    "machine_id",
    "user_id",
  ];

  for (const key of trackFields) {
    if (fields[key] !== undefined && fields[key] !== existing[key]) {
      updates[key] = fields[key];
    }
  }

  // notes_admin saved silently (no activity log)
  if (fields.notes_admin !== undefined) {
    db.prepare("UPDATE demandes SET notes_admin = ? WHERE id = ?").run(
      fields.notes_admin?.trim() || null,
      id,
    );
  }

  if (fields.status !== undefined) {
    if (fields.status === "resolue" && existing.status !== "resolue") {
      db.prepare(
        "UPDATE demandes SET resolved_at = datetime('now') WHERE id = ?",
      ).run(id);
    }
    if (fields.status === "fermee" && existing.status !== "fermee") {
      db.prepare(
        "UPDATE demandes SET closed_at = datetime('now') WHERE id = ?",
      ).run(id);
    }
  }

  if (Object.keys(updates).length > 0) {
    const sets = Object.keys(updates).map((k) => `${k} = ?`);
    const values = Object.values(updates);
    sets.push("last_activity_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE demandes SET ${sets.join(", ")} WHERE id = ?`).run(
      ...values,
    );

    if (updates.status) {
      logActivity({
        demandeId: id,
        userId: actorId,
        action: "status_change",
        details: { from: existing.status, to: updates.status },
        isPublic: true,
      });
    } else {
      logActivity({
        demandeId: id,
        userId: actorId,
        action: "field_update",
        details: updates,
        isPublic: true,
      });
    }
  }

  if (fields.read_by_client !== undefined) {
    db.prepare("UPDATE demandes SET read_by_client = ? WHERE id = ?").run(
      fields.read_by_client ? 1 : 0,
      id,
    );
  }

  if (fields.read_by_admin !== undefined) {
    db.prepare("UPDATE demandes SET read_by_admin = ? WHERE id = ?").run(
      fields.read_by_admin ? 1 : 0,
      id,
    );
  }

  return getDemandeById(id);
}

export function getRecentDemandes(limit = 10, userId = null) {
  if (userId) {
    return db
      .prepare(
        `${DEMANDE_SELECT} WHERE d.user_id = ? ORDER BY d.created_at DESC LIMIT ?`,
      )
      .all(userId, limit);
  }
  return db
    .prepare(`${DEMANDE_SELECT} ORDER BY d.created_at DESC LIMIT ?`)
    .all(limit);
}

export function addMessage({ demandeId, userId, contenu }) {
  const result = db
    .prepare(
      "INSERT INTO messages (demande_id, user_id, contenu) VALUES (?, ?, ?)",
    )
    .run(demandeId, userId, contenu);

  logActivity({
    demandeId,
    userId,
    action: "message",
    details: { contenu: contenu.slice(0, 120) },
    isPublic: true,
  });

  const user = findAppUserById(userId);
  if (user?.role === "admin") {
    const demande = getDemandeById(demandeId);
    if (demande?.status === "nouvelle") {
      updateDemande(demandeId, { status: "en_cours" }, userId);
    }
    db.prepare("UPDATE demandes SET read_by_client = 0 WHERE id = ?").run(
      demandeId,
    );
  } else {
    db.prepare("UPDATE demandes SET read_by_admin = 0 WHERE id = ?").run(
      demandeId,
    );
  }

  return getMessageById(result.lastInsertRowid);
}

export function getMessageById(id) {
  return db
    .prepare(
      `SELECT m.*, u.nom AS auteur_nom, u.prenom AS auteur_prenom, u.name AS auteur_name, u.role AS auteur_role
       FROM messages m
       LEFT JOIN user u ON u.id = m.user_id
       WHERE m.id = ?`,
    )
    .get(id);
}

export function listMessagesForDemande(demandeId) {
  return db
    .prepare(
      `SELECT m.*, u.nom AS auteur_nom, u.prenom AS auteur_prenom, u.name AS auteur_name, u.role AS auteur_role
       FROM messages m
       LEFT JOIN user u ON u.id = m.user_id
       WHERE m.demande_id = ?
       ORDER BY m.created_at ASC`,
    )
    .all(demandeId);
}

export function listNotesForDemande(demandeId) {
  return db
    .prepare(
      `SELECT n.*, u.nom AS auteur_nom, u.prenom AS auteur_prenom, u.name AS auteur_name
       FROM demande_notes n
       LEFT JOIN user u ON u.id = n.user_id
       WHERE n.demande_id = ?
       ORDER BY n.created_at ASC`,
    )
    .all(demandeId);
}

export function createNote({ demandeId, userId, contenu }) {
  const result = db
    .prepare(
      "INSERT INTO demande_notes (demande_id, user_id, contenu) VALUES (?, ?, ?)",
    )
    .run(demandeId, userId, contenu);

  logActivity({
    demandeId,
    userId,
    action: "note_added",
    details: { contenu: contenu.slice(0, 80) },
    isPublic: false,
  });

  return db
    .prepare("SELECT * FROM demande_notes WHERE id = ?")
    .get(result.lastInsertRowid);
}

export function updateNote(id, contenu, actorId) {
  const note = db.prepare("SELECT * FROM demande_notes WHERE id = ?").get(id);
  if (!note) return null;

  db.prepare(
    "UPDATE demande_notes SET contenu = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(contenu, id);

  logActivity({
    demandeId: note.demande_id,
    userId: actorId,
    action: "note_updated",
    isPublic: false,
  });

  return db.prepare("SELECT * FROM demande_notes WHERE id = ?").get(id);
}

export function deleteNote(id, actorId) {
  const note = db.prepare("SELECT * FROM demande_notes WHERE id = ?").get(id);
  if (!note) return null;

  db.prepare("DELETE FROM demande_notes WHERE id = ?").run(id);
  logActivity({
    demandeId: note.demande_id,
    userId: actorId,
    action: "note_deleted",
    isPublic: false,
  });
  return note;
}

export function listClientNotes(userId) {
  return db
    .prepare(
      `SELECT n.*, u.nom AS auteur_nom, u.prenom AS auteur_prenom, u.name AS auteur_name
       FROM client_notes n
       LEFT JOIN user u ON u.id = n.admin_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
    )
    .all(userId);
}

export function createClientNote({ userId, adminId, contenu }) {
  const result = db
    .prepare(
      "INSERT INTO client_notes (user_id, admin_id, contenu) VALUES (?, ?, ?)",
    )
    .run(userId, adminId, contenu);

  return db
    .prepare(
      `SELECT n.*, u.nom AS auteur_nom, u.prenom AS auteur_prenom, u.name AS auteur_name
       FROM client_notes n
       LEFT JOIN user u ON u.id = n.admin_id
       WHERE n.id = ?`,
    )
    .get(result.lastInsertRowid);
}

export function listFaq({ categorie, search } = {}) {
  let sql = "SELECT * FROM faq WHERE 1=1";
  const params = [];

  if (categorie) {
    sql += " AND categorie = ?";
    params.push(categorie);
  }

  if (search?.trim()) {
    sql += " AND (question LIKE ? OR reponse LIKE ?)";
    const q = `%${search.trim()}%`;
    params.push(q, q);
  }

  sql += " ORDER BY updated_at DESC";
  return db.prepare(sql).all(...params);
}

export function listFaqCategories() {
  return db
    .prepare(
      "SELECT DISTINCT categorie FROM faq WHERE categorie IS NOT NULL AND categorie != '' ORDER BY categorie",
    )
    .all()
    .map((r) => r.categorie);
}

export function getFaqById(id) {
  return db.prepare("SELECT * FROM faq WHERE id = ?").get(id);
}

export function createFaq({ question, reponse, categorie, userId }) {
  const result = db
    .prepare("INSERT INTO faq (question, reponse, categorie) VALUES (?, ?, ?)")
    .run(question, reponse, categorie ?? null);

  const entry = getFaqById(result.lastInsertRowid);
  db.prepare(
    `INSERT INTO faq_history (faq_id, user_id, question, reponse, categorie) VALUES (?, ?, ?, ?, ?)`,
  ).run(entry.id, userId ?? null, question, reponse, categorie ?? null);

  return entry;
}

export function updateFaq(id, { question, reponse, categorie }, userId) {
  const existing = getFaqById(id);
  if (!existing) return null;

  db.prepare(
    "UPDATE faq SET question = ?, reponse = ?, categorie = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(question, reponse, categorie ?? null, id);

  db.prepare(
    `INSERT INTO faq_history (faq_id, user_id, question, reponse, categorie) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, userId ?? null, question, reponse, categorie ?? null);

  return getFaqById(id);
}

export function deleteFaq(id) {
  return db.prepare("DELETE FROM faq WHERE id = ?").run(id);
}

export function listFaqHistory(faqId) {
  return db
    .prepare(
      `SELECT h.*, u.nom AS user_nom, u.prenom AS user_prenom, u.name AS user_name
       FROM faq_history h
       LEFT JOIN user u ON u.id = h.user_id
       WHERE h.faq_id = ?
       ORDER BY h.created_at DESC`,
    )
    .all(faqId);
}

export function seedFaqIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS n FROM faq").get()?.n ?? 0;
  if (count > 0) return;

  const insert = db.prepare(
    "INSERT INTO faq (question, reponse, categorie) VALUES (?, ?, ?)",
  );
  const entries = [
    [
      "Comment réinitialiser ma chaudière ?",
      "Coupez l'alimentation électrique pendant 30 secondes, puis rallumez.",
      "Panne",
    ],
    [
      "Quelle est la fréquence d'entretien recommandée ?",
      "Un entretien annuel est obligatoire pour les chaudières gaz et fioul.",
      "Maintenance",
    ],
    [
      "Ma machine affiche une erreur E03, que faire ?",
      "L'erreur E03 indique un problème de pression d'eau. Vérifiez le manomètre.",
      "Panne",
    ],
  ];
  for (const [question, reponse, categorie] of entries) {
    insert.run(question, reponse, categorie);
  }
}
