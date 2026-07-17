"use server";

import {
  createDemande as createDemandeRow,
  findAppUserById,
  formatDemandeDisplay,
  getDemandeById,
  getTechnicianById,
  getTechnicianBySpecialite,
} from "@/db/db";
import { authActionClient } from "@/lib/action";
import type { DemandeDisplay } from "@/types/demande";
import { z } from "zod";

const schema = z.object({
  titre: z.string(),
  description: z.string(),
  type: z.string(),
  priorite: z.string(),
  machineId: z.union([z.string(), z.number(), z.null()]).optional(),
  userId: z.string().optional(),
  assignedTo: z.string().nullable().optional(),
});

export const createDemande = authActionClient
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const {
      titre,
      description,
      type,
      priorite,
      machineId,
      userId,
      assignedTo,
    } = parsedInput;

    if (!titre?.trim() || !description?.trim() || !type || !priorite) {
      throw new Error("Titre, description, type et priorité sont obligatoires.");
    }

    let targetUserId = user.id;

    if (user.role === "admin") {
      if (!userId) {
        throw new Error("Sélectionnez un client.");
      }
      const client = await findAppUserById(userId);
      if (!client || client.role !== "client") {
        throw new Error("Client invalide.");
      }
      targetUserId = client.id;
    }

    const technician = assignedTo
      ? await getTechnicianById(assignedTo)
      : await getTechnicianBySpecialite(type);

    const row = await createDemandeRow({
      userId: targetUserId,
      machineId: machineId ? Number(machineId) : null,
      titre: titre.trim(),
      description: description.trim(),
      type,
      priorite,
      assignedTo: assignedTo ?? (technician ? String(technician.id) : null),
      actorId: user.id,
    });

    const demande = formatDemandeDisplay(await getDemandeById(row.id));

    if (!demande) {
      throw new Error("Une erreur est survenue.");
    }

    return { demande } satisfies { demande: DemandeDisplay };
  });
