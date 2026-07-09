import { NextResponse } from "next/server";
import {
  formatUserDisplay,
  listAllDemandes,
  listClients,
  listDemandesForUser,
  listFaq,
} from "@/db/db";
import type { DemandeRowJoined } from "@/types/demande";
import { getSessionUser, guardUser, authErrorResponse } from "@/lib/session";
import type { SearchResponse } from "@/types/user";

const LIMIT = 6;

function clientLabel(demande: DemandeRowJoined): string {
  const prenom = demande.client_prenom || "";
  const nom = demande.client_nom || "";
  return (
    [prenom, nom].filter(Boolean).join(" ") ||
    demande.client_name ||
    demande.client_email ||
    ""
  );
}

export async function GET(
  request: Request,
): Promise<NextResponse<SearchResponse | { error: string }>> {
  const sessionUser = await getSessionUser();
  const auth = guardUser(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);
  const user = auth.user;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 2) {
    return NextResponse.json({ faq: [], demandes: [], clients: [] });
  }

  const isAdmin = user.role === "admin";
  const needle = q.toLowerCase();

  const faq = (
    (await listFaq({ search: q })) as Array<{
    id: number;
    question: string;
    categorie: string | null;
  }>)
    .slice(0, LIMIT)
    .map((entry) => ({
      id: entry.id,
      question: entry.question,
      categorie: entry.categorie,
    }));

  const allDemandes = isAdmin
    ? ((await listAllDemandes()) as DemandeRowJoined[])
    : ((await listDemandesForUser(user.id)) as DemandeRowJoined[]);

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

  let clients: SearchResponse["clients"] = [];
  if (isAdmin) {
    clients = (await listClients({ search: q }))
      .slice(0, LIMIT)
      .map(formatUserDisplay)
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .map((c) => ({
        id: c.id,
        displayName: c.displayName,
        email: c.email,
      }));
  }

  return NextResponse.json({ faq, demandes, clients });
}
