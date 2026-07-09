import { prisma } from "@/lib/prisma";
import { toIsoString } from "./helpers";
import { findAppUserById } from "./user";
import {
  getDemandeById,
  logActivity,
  updateDemande,
} from "./demande";
import {
  createNotification,
  notifyAdmins,
  listNotificationsForUser,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notifications";

export const AI_ASSISTANT_EMAIL = "assistant-ia@internal.caustier";

type MachineRow = {
  id: number;
  user_id: string;
  nom: string;
  marque: string | null;
  produits_calibres: string | null;
  version_logiciel: string | null;
  date_mise_en_service: string | null;
  pilote_ligne: string | null;
  technicien_charge: string | null;
  nombre_lignes: number | null;
  serveurs_vision: string | null;
  notes_internes: string | null;
  created_at: string;
  updated_at: string;
};

function mapMachine(row: {
  id: number;
  userId: string;
  nom: string;
  marque: string | null;
  produits_calibres: string | null;
  version_logiciel: string | null;
  date_mise_en_service: string | null;
  pilote_ligne: string | null;
  technicien_charge: string | null;
  nombre_lignes: number | null;
  serveurs_vision: string | null;
  notes_internes: string | null;
  created_at: Date;
  updated_at: Date;
}): MachineRow {
  return {
    id: row.id,
    user_id: row.userId,
    nom: row.nom,
    marque: row.marque,
    produits_calibres: row.produits_calibres,
    version_logiciel: row.version_logiciel,
    date_mise_en_service: row.date_mise_en_service,
    pilote_ligne: row.pilote_ligne,
    technicien_charge: row.technicien_charge,
    nombre_lignes: row.nombre_lignes,
    serveurs_vision: row.serveurs_vision,
    notes_internes: row.notes_internes,
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
  };
}

export async function listMachinesForUser(userId: string): Promise<MachineRow[]> {
  const rows = await prisma.machine.findMany({
    where: { userId },
    orderBy: { nom: "asc" },
  });
  return rows.map(mapMachine);
}

export async function getMachineById(id: number): Promise<MachineRow | undefined> {
  const row = await prisma.machine.findUnique({ where: { id } });
  return row ? mapMachine(row) : undefined;
}

export async function createMachine(
  userId: string,
  data: {
    nom: string;
    marque?: string | null;
    produits_calibres?: string | null;
    version_logiciel?: string | null;
    date_mise_en_service?: string | null;
    pilote_ligne?: string | null;
    technicien_charge?: string | null;
    nombre_lignes?: number | null;
    serveurs_vision?: string | null;
    notes_internes?: string | null;
  },
): Promise<MachineRow | undefined> {
  const row = await prisma.machine.create({
    data: {
      userId,
      nom: data.nom,
      marque: data.marque ?? null,
      produits_calibres: data.produits_calibres ?? null,
      version_logiciel: data.version_logiciel ?? null,
      date_mise_en_service: data.date_mise_en_service ?? null,
      pilote_ligne: data.pilote_ligne ?? null,
      technicien_charge: data.technicien_charge ?? null,
      nombre_lignes: data.nombre_lignes ?? null,
      serveurs_vision: data.serveurs_vision ?? null,
      notes_internes: data.notes_internes ?? null,
    },
  });
  return mapMachine(row);
}

export async function updateMachine(
  id: number,
  data: {
    nom: string;
    marque?: string | null;
    produits_calibres?: string | null;
    version_logiciel?: string | null;
    date_mise_en_service?: string | null;
    pilote_ligne?: string | null;
    technicien_charge?: string | null;
    nombre_lignes?: number | null;
    serveurs_vision?: string | null;
    notes_internes?: string | null;
  },
): Promise<MachineRow | undefined> {
  const row = await prisma.machine.update({
    where: { id },
    data: {
      nom: data.nom,
      marque: data.marque ?? null,
      produits_calibres: data.produits_calibres ?? null,
      version_logiciel: data.version_logiciel ?? null,
      date_mise_en_service: data.date_mise_en_service ?? null,
      pilote_ligne: data.pilote_ligne ?? null,
      technicien_charge: data.technicien_charge ?? null,
      nombre_lignes: data.nombre_lignes ?? null,
      serveurs_vision: data.serveurs_vision ?? null,
      notes_internes: data.notes_internes ?? null,
    },
  });
  return mapMachine(row);
}

export async function deleteMachine(id: number): Promise<{ count: number }> {
  await prisma.machine.delete({ where: { id } });
  return { count: 1 };
}

type MessageJoinedRow = {
  id: number;
  demande_id: number;
  user_id: string;
  contenu: string;
  created_at: string;
  auteur_nom: string | null;
  auteur_prenom: string | null;
  auteur_name: string | null;
  auteur_role: string | null;
};

export async function getMessageById(
  id: number,
): Promise<MessageJoinedRow | undefined> {
  const row = await prisma.message.findUnique({
    where: { id },
    include: {
      user: {
        select: { nom: true, prenom: true, name: true, role: true },
      },
    },
  });
  if (!row) return undefined;
  return {
    id: row.id,
    demande_id: row.demandeId,
    user_id: row.userId,
    contenu: row.contenu,
    created_at: toIsoString(row.created_at),
    auteur_nom: row.user.nom,
    auteur_prenom: row.user.prenom,
    auteur_name: row.user.name,
    auteur_role: row.user.role,
  };
}

export async function addMessage({
  demandeId,
  userId,
  contenu,
}: {
  demandeId: number;
  userId: string;
  contenu: string;
}): Promise<MessageJoinedRow | undefined> {
  const row = await prisma.message.create({
    data: { demandeId, userId, contenu },
  });

  await logActivity({
    demandeId,
    userId,
    action: "message",
    details: { contenu: contenu.slice(0, 120) },
    isPublic: true,
  });

  const user = await findAppUserById(userId);
  const demande = await getDemandeById(demandeId);

  if (user?.role === "admin" && demande) {
    if (demande.status === "nouvelle") {
      await updateDemande(demandeId, { status: "en_cours" }, userId, {
        skipNotifications: true,
      });
    }
    await prisma.demande.update({
      where: { id: demandeId },
      data: { read_by_client: false },
    });

    await createNotification({
      userId: demande.user_id,
      type: "reponse_admin",
      demandeId,
      message: `Nouvelle réponse sur la demande #${demandeId} : ${demande.titre}`,
    });
  } else if (demande) {
    await prisma.demande.update({
      where: { id: demandeId },
      data: { read_by_admin: false },
    });

    await notifyAdmins({
      type: "reponse_client",
      demandeId,
      message: `Réponse client sur la demande #${demandeId} : ${demande.titre}`,
    });
  }

  return getMessageById(row.id);
}

export async function listMessagesForDemande(
  demandeId: number,
): Promise<MessageJoinedRow[]> {
  const rows = await prisma.message.findMany({
    where: { demandeId },
    include: {
      user: {
        select: { nom: true, prenom: true, name: true, role: true },
      },
    },
    orderBy: { created_at: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    demande_id: row.demandeId,
    user_id: row.userId,
    contenu: row.contenu,
    created_at: toIsoString(row.created_at),
    auteur_nom: row.user.nom,
    auteur_prenom: row.user.prenom,
    auteur_name: row.user.name,
    auteur_role: row.user.role,
  }));
}

type DemandeNoteRow = {
  id: number;
  demande_id: number;
  user_id: string;
  contenu: string;
  created_at: string;
  updated_at: string;
  auteur_nom: string | null;
  auteur_prenom: string | null;
  auteur_name: string | null;
};

export async function listNotesForDemande(
  demandeId: number,
): Promise<DemandeNoteRow[]> {
  const rows = await prisma.demandeNote.findMany({
    where: { demandeId },
    include: {
      user: { select: { nom: true, prenom: true, name: true } },
    },
    orderBy: { created_at: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    demande_id: row.demandeId,
    user_id: row.userId,
    contenu: row.contenu,
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
    auteur_nom: row.user.nom,
    auteur_prenom: row.user.prenom,
    auteur_name: row.user.name,
  }));
}

export async function createNote({
  demandeId,
  userId,
  contenu,
}: {
  demandeId: number;
  userId: string;
  contenu: string;
}): Promise<DemandeNoteRow> {
  const row = await prisma.demandeNote.create({
    data: { demandeId, userId, contenu },
    include: {
      user: { select: { nom: true, prenom: true, name: true } },
    },
  });

  await logActivity({
    demandeId,
    userId,
    action: "note_added",
    details: { contenu: contenu.slice(0, 80) },
    isPublic: false,
  });

  return {
    id: row.id,
    demande_id: row.demandeId,
    user_id: row.userId,
    contenu: row.contenu,
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
    auteur_nom: row.user.nom,
    auteur_prenom: row.user.prenom,
    auteur_name: row.user.name,
  };
}

export async function updateNote(
  id: number,
  contenu: string,
  actorId: string,
): Promise<DemandeNoteRow | null> {
  const note = await prisma.demandeNote.findUnique({ where: { id } });
  if (!note) return null;

  const row = await prisma.demandeNote.update({
    where: { id },
    data: { contenu },
    include: {
      user: { select: { nom: true, prenom: true, name: true } },
    },
  });

  await logActivity({
    demandeId: note.demandeId,
    userId: actorId,
    action: "note_updated",
    isPublic: false,
  });

  return {
    id: row.id,
    demande_id: row.demandeId,
    user_id: row.userId,
    contenu: row.contenu,
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
    auteur_nom: row.user.nom,
    auteur_prenom: row.user.prenom,
    auteur_name: row.user.name,
  };
}

export async function deleteNote(
  id: number,
  actorId: string,
): Promise<DemandeNoteRow | null> {
  const note = await prisma.demandeNote.findUnique({
    where: { id },
    include: {
      user: { select: { nom: true, prenom: true, name: true } },
    },
  });
  if (!note) return null;

  await prisma.demandeNote.delete({ where: { id } });
  await logActivity({
    demandeId: note.demandeId,
    userId: actorId,
    action: "note_deleted",
    isPublic: false,
  });

  return {
    id: note.id,
    demande_id: note.demandeId,
    user_id: note.userId,
    contenu: note.contenu,
    created_at: toIsoString(note.created_at),
    updated_at: toIsoString(note.updated_at),
    auteur_nom: note.user.nom,
    auteur_prenom: note.user.prenom,
    auteur_name: note.user.name,
  };
}

type FaqRow = {
  id: number;
  question: string;
  reponse: string;
  categorie: string | null;
  created_at: string;
  updated_at: string;
};

function mapFaq(row: {
  id: number;
  question: string;
  reponse: string;
  categorie: string | null;
  created_at: Date;
  updated_at: Date;
}): FaqRow {
  return {
    id: row.id,
    question: row.question,
    reponse: row.reponse,
    categorie: row.categorie,
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
  };
}

export async function listFaq({
  categorie,
  search,
}: { categorie?: string; search?: string } = {}): Promise<FaqRow[]> {
  const rows = await prisma.faq.findMany({
    where: {
      ...(categorie ? { categorie } : {}),
      ...(search?.trim()
        ? {
            OR: [
              { question: { contains: search.trim(), mode: "insensitive" } },
              { reponse: { contains: search.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updated_at: "desc" },
  });
  return rows.map(mapFaq);
}

export async function listFaqCategories(): Promise<string[]> {
  const rows = await prisma.faq.findMany({
    where: {
      categorie: { not: null },
      NOT: { categorie: "" },
    },
    select: { categorie: true },
    distinct: ["categorie"],
    orderBy: { categorie: "asc" },
  });
  return rows
    .map((row) => row.categorie)
    .filter((value): value is string => Boolean(value));
}

export async function getFaqById(id: number): Promise<FaqRow | undefined> {
  const row = await prisma.faq.findUnique({ where: { id } });
  return row ? mapFaq(row) : undefined;
}

export async function createFaq({
  question,
  reponse,
  categorie,
  userId,
}: {
  question: string;
  reponse: string;
  categorie?: string | null;
  userId?: string | null;
}): Promise<FaqRow> {
  const entry = await prisma.faq.create({
    data: {
      question,
      reponse,
      categorie: categorie ?? null,
    },
  });

  await prisma.faqHistory.create({
    data: {
      faqId: entry.id,
      userId: userId ?? null,
      question,
      reponse,
      categorie: categorie ?? null,
    },
  });

  return mapFaq(entry);
}

export async function updateFaq(
  id: number,
  {
    question,
    reponse,
    categorie,
  }: { question: string; reponse: string; categorie?: string | null },
  userId?: string | null,
): Promise<FaqRow | null> {
  const existing = await getFaqById(id);
  if (!existing) return null;

  const entry = await prisma.faq.update({
    where: { id },
    data: {
      question,
      reponse,
      categorie: categorie ?? null,
    },
  });

  await prisma.faqHistory.create({
    data: {
      faqId: id,
      userId: userId ?? null,
      question,
      reponse,
      categorie: categorie ?? null,
    },
  });

  return mapFaq(entry);
}

export async function deleteFaq(id: number): Promise<{ count: number }> {
  await prisma.faq.delete({ where: { id } });
  return { count: 1 };
}

type FaqHistoryRow = {
  id: number;
  faq_id: number;
  user_id: string | null;
  question: string;
  reponse: string;
  categorie: string | null;
  created_at: string;
  user_nom: string | null;
  user_prenom: string | null;
  user_name: string | null;
};

export async function listFaqHistory(faqId: number): Promise<FaqHistoryRow[]> {
  const rows = await prisma.faqHistory.findMany({
    where: { faqId },
    include: {
      user: { select: { nom: true, prenom: true, name: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    faq_id: row.faqId,
    user_id: row.userId,
    question: row.question,
    reponse: row.reponse,
    categorie: row.categorie,
    created_at: toIsoString(row.created_at),
    user_nom: row.user?.nom ?? null,
    user_prenom: row.user?.prenom ?? null,
    user_name: row.user?.name ?? null,
  }));
}

export async function seedFaqIfEmpty(): Promise<void> {
  const count = await prisma.faq.count();
  if (count > 0) return;

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
  ] as const;

  for (const [question, reponse, categorie] of entries) {
    await prisma.faq.create({
      data: { question, reponse, categorie },
    });
  }
}

export {
  createNotification,
  notifyAdmins,
  listNotificationsForUser,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};

export {
  createDemande,
  deleteDemande,
  formatDemandeDisplay,
  getDemandeById,
  getRecentDemandes,
  listActivityForDemande,
  listAllDemandes,
  listDemandesForTechnician,
  listDemandesForUser,
  logActivity,
  touchDemandeActivity,
  updateDemande,
} from "./demande";

export {
  createTechnician,
  createTechnicianNote,
  deleteTechnician,
  formatTechnicienDisplay,
  getTechnicianById,
  getTechnicianBySpecialite,
  listTechnicianNotes,
  listTechnicians,
  updateTechnician,
} from "./technicien";

export {
  createClientNote,
  findAppUserByEmail,
  findAppUserById,
  formatUserDisplay,
  getAiAssistantUserId,
  listAdmins,
  listClientNotes,
  listClients,
  updateAppUser,
  updateUserEmail,
} from "./user";
