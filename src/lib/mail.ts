import { Resend } from "resend";

export type SendMailResult = { ok: true } | { ok: false; error: string };

export type TechnicianWelcomeEmailInput = {
  to: string;
  name: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
};

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "Caustier SAV <onboarding@resend.dev>"
  );
}

export async function sendTechnicianWelcomeEmail(
  input: TechnicianWelcomeEmailInput,
): Promise<SendMailResult> {
  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY manquante." };
  }

  const subject = "Votre compte technicien Caustier SAV";
  const text = [
    `Bonjour ${input.name},`,
    "",
    "Un compte technicien a été créé pour vous sur Caustier SAV.",
    "",
    `Connexion : ${input.loginUrl}`,
    `Email : ${input.email}`,
    `Mot de passe temporaire : ${input.tempPassword}`,
    "",
    "Vous devrez changer ce mot de passe à la première connexion.",
    "",
    "— Caustier SAV",
  ].join("\n");

  const html = `
    <p>Bonjour <strong>${escapeHtml(input.name)}</strong>,</p>
    <p>Un compte technicien a été créé pour vous sur Caustier SAV.</p>
    <p>
      <a href="${escapeHtml(input.loginUrl)}">Se connecter</a><br />
      Email : <strong>${escapeHtml(input.email)}</strong><br />
      Mot de passe temporaire : <strong>${escapeHtml(input.tempPassword)}</strong>
    </p>
    <p>Vous devrez changer ce mot de passe à la première connexion.</p>
    <p>— Caustier SAV</p>
  `;

  return sendEmail({
    to: input.to,
    subject,
    text,
    html,
  });
}

export type AssignmentEmailInput = {
  to: string;
  name: string;
  titre: string;
  demandeId: number;
  demandeUrl: string;
};

/** Email de secours quand le technicien n'a pas de téléphone (pas de WhatsApp). */
export async function sendAssignmentEmail(
  input: AssignmentEmailInput,
): Promise<SendMailResult> {
  const subject = `Demande assignée #${input.demandeId} — Caustier SAV`;
  const text = [
    `Bonjour ${input.name},`,
    "",
    `Une demande vous a été proposée : « ${input.titre} » (#${input.demandeId}).`,
    "",
    "Ouvrez la fiche pour prendre en charge la demande (les coordonnées client y sont visibles).",
    "",
    `Ouvrir la demande : ${input.demandeUrl}`,
    "",
    "— Caustier SAV",
  ].join("\n");

  const html = `
    <p>Bonjour <strong>${escapeHtml(input.name)}</strong>,</p>
    <p>
      Une demande vous a été proposée :
      <strong>« ${escapeHtml(input.titre)} »</strong>
      (#${input.demandeId}).
    </p>
    <p>Ouvrez la fiche pour prendre en charge la demande (les coordonnées client y sont visibles).</p>
    <p><a href="${escapeHtml(input.demandeUrl)}">Ouvrir la demande</a></p>
    <p>— Caustier SAV</p>
  `;

  return sendEmail({
    to: input.to,
    subject,
    text,
    html,
  });
}

export type ClientContactEmailInput = {
  to: string;
  technicianName: string;
  demandeId: number;
  titre: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  demandeUrl: string;
};

/** Coordonnées client après self-assign ou quand le technicien n'a pas WhatsApp. */
export async function sendClientContactEmail(
  input: ClientContactEmailInput,
): Promise<SendMailResult> {
  const contactLines: string[] = [`Client : ${input.clientName}`];
  if (input.clientPhone) {
    contactLines.push(`Téléphone : ${input.clientPhone}`);
  }
  if (input.clientEmail) {
    contactLines.push(`Email : ${input.clientEmail}`);
  }
  if (!input.clientPhone && !input.clientEmail) {
    contactLines.push(
      "Coordonnées non renseignées — contactez l'administration.",
    );
  }

  const subject = `Coordonnées client — demande #${input.demandeId}`;
  const text = [
    `Bonjour ${input.technicianName},`,
    "",
    `Demande #${input.demandeId} : « ${input.titre} ».`,
    "",
    ...contactLines,
    "",
    `Fiche demande : ${input.demandeUrl}`,
    "",
    "— Caustier SAV",
  ].join("\n");

  const htmlContact = [
    `<li>Client : <strong>${escapeHtml(input.clientName)}</strong></li>`,
    input.clientPhone
      ? `<li>Téléphone : <strong>${escapeHtml(input.clientPhone)}</strong></li>`
      : "",
    input.clientEmail
      ? `<li>Email : <strong>${escapeHtml(input.clientEmail)}</strong></li>`
      : "",
    !input.clientPhone && !input.clientEmail
      ? "<li>Coordonnées non renseignées — contactez l'administration.</li>"
      : "",
  ]
    .filter(Boolean)
    .join("");

  const html = `
    <p>Bonjour <strong>${escapeHtml(input.technicianName)}</strong>,</p>
    <p>
      Demande #${input.demandeId} :
      <strong>« ${escapeHtml(input.titre)} »</strong>.
    </p>
    <ul>${htmlContact}</ul>
    <p><a href="${escapeHtml(input.demandeUrl)}">Ouvrir la fiche demande</a></p>
    <p>— Caustier SAV</p>
  `;

  return sendEmail({
    to: input.to,
    subject,
    text,
    html,
  });
}

async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<SendMailResult> {
  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY manquante." };
  }

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Envoi email échoué.";
    return { ok: false, error: message };
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
