"use server";

import {
  createDemande as createDemandeRow,
  findAppUserById,
  formatDemandeDisplay,
  getDemandeById,
  getTechnicianById,
  getTechnicianBySpecialite,
  logActivity,
} from "@/db/db";
import { authActionClient } from "@/lib/action";
import { sendMessage } from "@/lib/whatsapp/send";
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

    const client = userId ? await findAppUserById(userId) : null;

    if (technician?.telephone) {
      try {
        await sendMessage({
          demandeId: row.id,
          technicianNumber: technician.telephone,
          technicianName: technician.name,
          clientName: client?.name ?? "Client",
          description: description.trim(),
          type,
          priority: priorite,
        });

        await logActivity({
          demandeId: row.id,
          userId: null,
          action: "whatsapp_message_sent",
          details: {
            technicianId: technician.id,
            technicianName: technician.name,
            technicianNumber: technician.telephone,
            clientName: client?.name ?? "Client",
            description: description.trim(),
            type,
            priority: priorite,
            initialNotification: true,
          },
          isPublic: true,
        });
      } catch (error) {
        console.error(error);
        await logActivity({
          demandeId: row.id,
          userId: null,
          action: "whatsapp_message_failed",
          details: {
            technicianId: technician.id,
            technicianName: technician.name,
            error: error instanceof Error ? error.message : "Erreur inconnue",
            initialNotification: true,
          },
          isPublic: true,
        });
      }
    }

    const demande = formatDemandeDisplay(await getDemandeById(row.id));

    if (!demande) {
      throw new Error("Une erreur est survenue.");
    }

    return { demande } satisfies { demande: DemandeDisplay };
  });
