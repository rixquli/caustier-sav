import { NextResponse } from "next/server";
import {
  formatUserDisplay,
  listAllDemandes,
  listClients,
  listDemandesForUser,
  listFaq,
} from "@/db/db";
import { getSessionUser, requireUser } from "@/lib/session";

const LIMIT = 6;

function clientLabel(demande) {
  const prenom = demande.client_prenom || "";
  const nom = demande.client_nom || "";
  return (
    [prenom, nom].filter(Boolean).join(" ") ||
    demande.client_name ||
    demande.client_email ||
    ""
  );
}

export async function GET(request) {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 2) {
    return NextResponse.json({ faq: [], demandes: [], clients: [] });
  }

  const isAdmin = user.role === "admin";
  const needle = q.toLowerCase();

  const faq = listFaq({ search: q })
    .slice(0, LIMIT)
    .map((entry) => ({
      id: entry.id,
      question: entry.question,
      categorie: entry.categorie,
    }));

  const allDemandes = isAdmin
    ? listAllDemandes()
    : listDemandesForUser(user.id);

  const demandes = allDemandes
    .filter((d) => {
      const haystack = [
        d.titre,
        d.description,
        d.machine_nom,
        clientLabel(d),
        `#${d.id}`,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    })
    .slice(0, LIMIT)
    .map((d) => ({
      id: d.id,
      titre: d.titre,
      status: d.status,
      client: clientLabel(d),
    }));

  let clients = [];
  if (isAdmin) {
    clients = listClients({ search: q })
      .slice(0, LIMIT)
      .map(formatUserDisplay)
      .map((c) => ({
        id: c.id,
        displayName: c.displayName,
        email: c.email,
      }));
  }

  return NextResponse.json({ faq, demandes, clients });
}
