import { prisma } from "@/lib/prisma";
import { phonesMatch } from "@/lib/whatsapp/phone";
import { toIsoString } from "./helpers";
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
import type { Technicien } from "@/generated/prisma/client";

function parseTechnicienId(id: TechnicienId): number {
  return typeof id === "number" ? id : Number(id);
}

function mapTechnicienRow(row: Technicien): TechnicienRow {
  return {
    id: row.id,
    name: row.name,
    specialite: row.specialite,
    telephone: row.telephone,
    email: row.email,
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
    notes_technicien: row.notes_technicien,
  };
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

export async function createTechnician(
  input: CreateTechnicienInput,
): Promise<TechnicienRow | undefined> {
  const row = await prisma.technicien.create({
    data: {
      name: input.name.trim(),
      specialite: input.specialite?.trim() ?? "",
      telephone: input.phone?.trim() ?? "",
      email: input.email.trim(),
      notes_technicien: input.notes?.trim() || null,
    },
  });
  return mapTechnicienRow(row);
}

export async function updateTechnician(
  id: TechnicienId,
  data: UpdateTechnicienInput,
): Promise<TechnicienRow | null> {
  const existing = await getTechnicianById(id);
  if (!existing) return null;

  const row = await prisma.technicien.update({
    where: { id: parseTechnicienId(id) },
    data: {
      name: data.name ?? existing.name,
      specialite: data.specialite ?? existing.specialite,
      telephone: data.phone ?? data.phone_number ?? existing.telephone ?? "",
      email: data.email ?? existing.email,
      notes_technicien:
        data.notes_technicien !== undefined
          ? data.notes_technicien
          : existing.notes_technicien,
    },
  });
  return mapTechnicienRow(row);
}

export async function deleteTechnician(
  id: TechnicienId,
): Promise<TechnicienRow | null> {
  const existing = await getTechnicianById(id);
  if (!existing) return null;

  await prisma.technicien.delete({
    where: { id: parseTechnicienId(id) },
  });
  return existing;
}

export async function listTechnicians({
  search = "",
}: ListTechniciansParams = {}): Promise<TechnicienRow[]> {
  const rows = await prisma.technicien.findMany({
    where: search.trim()
      ? {
          OR: [
            { name: { contains: search.trim(), mode: "insensitive" } },
            { email: { contains: search.trim(), mode: "insensitive" } },
            { telephone: { contains: search.trim(), mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { created_at: "desc" },
  });
  return rows.map(mapTechnicienRow);
}

export async function getTechnicianById(
  id: TechnicienId,
): Promise<TechnicienRow | undefined> {
  const row = await prisma.technicien.findUnique({
    where: { id: parseTechnicienId(id) },
  });
  return row ? mapTechnicienRow(row) : undefined;
}

export async function getTechnicianBySpecialite(
  specialite: string,
): Promise<TechnicienRow | undefined> {
  const row = await prisma.technicien.findFirst({
    where: { specialite },
  });
  return row ? mapTechnicienRow(row) : undefined;
}

export async function getTechnicianByPhone(
  phone: string,
): Promise<TechnicienRow | undefined> {
  const rows = await prisma.technicien.findMany({
    where: { telephone: { not: "" } },
  });

  console.log("[WhatsApp Webhook] Recherche technicien par téléphone", {
    from: phone,
    candidates: rows.map((row) => ({
      id: row.id,
      name: row.name,
      telephone: row.telephone,
    })),
  });

  const match = rows.find((row) => phonesMatch(row.telephone, phone));
  return match ? mapTechnicienRow(match) : undefined;
}

export async function listTechnicianNotes(
  technicienId: TechnicienId,
): Promise<TechnicienNoteRow[]> {
  const rows = await prisma.technicienNote.findMany({
    where: { technicienId: parseTechnicienId(technicienId) },
    orderBy: { created_at: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    technicien_id: String(row.technicienId),
    contenu: row.contenu,
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
  }));
}

export async function createTechnicianNote(
  input: CreateTechnicienNoteInput,
): Promise<TechnicienNoteRow> {
  const row = await prisma.technicienNote.create({
    data: {
      technicienId: parseTechnicienId(input.technicien_id),
      contenu: input.contenu,
    },
  });

  return {
    id: row.id,
    technicien_id: String(row.technicienId),
    contenu: row.contenu,
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
  };
}
