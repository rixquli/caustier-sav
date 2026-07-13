import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Réserve atomiquement un message WhatsApp (évite les doubles traitements concurrents).
 * Retourne false si l'événement est déjà traité ou en cours.
 */
export async function claimWhatsappEvent(messageId: string): Promise<boolean> {
  try {
    await prisma.whatsappProcessedEvent.create({
      data: { id: messageId },
    });
    return true;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return false;
    }
    throw error;
  }
}

/** Libère la réservation après un échec transitoire pour permettre un retry Meta. */
export async function releaseWhatsappEvent(messageId: string): Promise<void> {
  await prisma.whatsappProcessedEvent.deleteMany({
    where: { id: messageId },
  });
}
