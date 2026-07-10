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

    try {
      sendMessage({
        technicianNumber: technician?.telephone ?? "0672651376",
        technicianName: technician?.name ?? "John Doe",
        clientName: client?.name ?? "John Doe",
        description: description ?? "Description de la demande",
        type: type ?? "IA",
        priority: priorite ?? "Normal",
      }).then(() => {
        void logActivity({
          demandeId: row.id,
          userId: null,
          action: "whatsapp_message_sent",
          details: {
            technicianName: technician?.name ?? "John Doe",
            technicianNumber: technician?.telephone ?? "0672651376",
            clientName: client?.name ?? "John Doe",
            description: description ?? "Description de la demande",
            type: type ?? "IA",
            priority: priorite ?? "Normal",
          },
          isPublic: true,
        });
      });
    } catch (error) {
      console.error(error);
      throw new Error("Erreur lors de l'envoi du message");
    }

    const demande = formatDemandeDisplay(await getDemandeById(row.id));

    if (!demande) {
      throw new Error("Une erreur est survenue.");
    }

    return { demande } satisfies { demande: DemandeDisplay };
  });
