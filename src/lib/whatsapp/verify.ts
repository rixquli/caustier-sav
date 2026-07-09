import { createHmac, timingSafeEqual } from "node:crypto";

const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

export function verifyWhatsappSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!APP_SECRET) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", APP_SECRET)
    .update(rawBody)
    .digest("hex");
  const received = signatureHeader.slice("sha256=".length);

  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex"),
    );
  } catch {
    return false;
  }
}
