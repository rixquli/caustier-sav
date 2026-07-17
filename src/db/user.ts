import { prisma } from "@/lib/prisma";
import { toIsoString } from "./helpers";
import type {
  AdminUserSummary,
  ClientNoteJoinedRow,
  CreateClientNoteInput,
  ListClientsParams,
  UpdateUserInput,
  UserDisplay,
  UserId,
  UserRow,
  UserRole,
} from "@/types/user";
import type { User } from "@/generated/prisma/client";

function toDbFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function mapUserRow(user: User): UserRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    createdAt: toIsoString(user.createdAt),
    updatedAt: toIsoString(user.updatedAt),
    role: (user.role ?? "client") as UserRole,
    nom: user.nom,
    prenom: user.prenom,
    phone: user.phone,
    adresse: user.adresse,
    archived: user.archived,
    mustChangePassword: user.mustChangePassword,
    notes_admin: user.notes_admin,
  };
}

export function formatUserDisplay(
  row: UserRow | null | undefined,
): UserDisplay | null {
  if (!row) return null;

  const nom = row.nom || row.name?.split(" ").slice(1).join(" ") || "";
  const prenom = row.prenom || row.name?.split(" ")[0] || "";

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    role: row.role,
    nom,
    prenom,
    phone: row.phone,
    adresse: row.adresse,
    notes_admin: row.notes_admin ?? null,
    archived: toDbFlag(row.archived),
    mustChangePassword: toDbFlag(row.mustChangePassword),
    displayName:
      [prenom, nom].filter(Boolean).join(" ") || row.name || row.email,
  };
}

export async function findAppUserById(
  id: UserId,
): Promise<UserRow | undefined> {
  const user = await prisma.user.findUnique({
    where: { id: String(id) },
  });
  return user ? mapUserRow(user) : undefined;
}

export async function findAppUserByEmail(
  email: string,
): Promise<UserRow | undefined> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return user ? mapUserRow(user) : undefined;
}

export async function listClients({
  search = "",
  includeArchived = false,
}: ListClientsParams = {}): Promise<UserRow[]> {
  const users = await prisma.user.findMany({
    where: {
      role: "client",
      ...(includeArchived
        ? {}
        : { OR: [{ archived: false }, { archived: null }] }),
      ...(search.trim()
        ? {
            OR: [
              { nom: { contains: search.trim(), mode: "insensitive" } },
              { prenom: { contains: search.trim(), mode: "insensitive" } },
              { email: { contains: search.trim(), mode: "insensitive" } },
              { name: { contains: search.trim(), mode: "insensitive" } },
              { phone: { contains: search.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return users.map(mapUserRow);
}

export async function listAdmins(): Promise<AdminUserSummary[]> {
  const users = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true, name: true, nom: true, prenom: true, email: true },
    orderBy: [{ nom: "asc" }, { name: "asc" }],
  });
  return users;
}

export async function updateAppUser(
  id: UserId,
  fields: UpdateUserInput,
): Promise<UserRow | null> {
  const data: Record<string, unknown> = {};
  const allowed: (keyof UpdateUserInput)[] = [
    "nom",
    "prenom",
    "phone",
    "adresse",
    "archived",
    "mustChangePassword",
    "name",
    "notes_admin",
    "role",
  ];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      if (key === "archived" || key === "mustChangePassword") {
        data[key] = toDbFlag(fields[key]);
      } else {
        data[key] = fields[key];
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return (await findAppUserById(id)) ?? null;
  }

  const user = await prisma.user.update({
    where: { id: String(id) },
    data,
  });
  return mapUserRow(user);
}

export async function updateUserEmail(id: UserId, email: string): Promise<void> {
  await prisma.user.update({
    where: { id: String(id) },
    data: { email: email.trim() },
  });
}

export async function listClientNotes(
  userId: UserId,
): Promise<ClientNoteJoinedRow[]> {
  const notes = await prisma.clientNote.findMany({
    where: { userId: String(userId) },
    include: {
      admin: { select: { nom: true, prenom: true, name: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return notes.map((note) => ({
    id: note.id,
    user_id: note.userId,
    admin_id: note.adminId,
    contenu: note.contenu,
    created_at: toIsoString(note.created_at),
    updated_at: toIsoString(note.updated_at),
    auteur_nom: note.admin.nom,
    auteur_prenom: note.admin.prenom,
    auteur_name: note.admin.name,
  }));
}

export async function createClientNote(
  input: CreateClientNoteInput,
): Promise<ClientNoteJoinedRow> {
  const note = await prisma.clientNote.create({
    data: {
      userId: String(input.userId),
      adminId: String(input.adminId),
      contenu: input.contenu,
    },
    include: {
      admin: { select: { nom: true, prenom: true, name: true } },
    },
  });

  return {
    id: note.id,
    user_id: note.userId,
    admin_id: note.adminId,
    contenu: note.contenu,
    created_at: toIsoString(note.created_at),
    updated_at: toIsoString(note.updated_at),
    auteur_nom: note.admin.nom,
    auteur_prenom: note.admin.prenom,
    auteur_name: note.admin.name,
  };
}

export async function getAiAssistantUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: "assistant-ia@internal.caustier" },
    select: { id: true },
  });
  return user?.id ?? null;
}
