import { NextResponse } from "next/server";
import { getRecentDemandes, listAllDemandes, listClients } from "@/db/db";
import { ACTIVE_STATUSES, CLOSED_STATUSES } from "@/lib/constants";
import { getSessionUser, requireUser } from "@/lib/session";

const PRIORITY_RANK = {
  critique: 0,
  haute: 1,
  normale: 2,
  faible: 3,
};

function sortByPriorityThenActivity(a, b) {
  const rank = (PRIORITY_RANK[a.priorite] ?? 99) - (PRIORITY_RANK[b.priorite] ?? 99);
  if (rank !== 0) return rank;

  return new Date(b.last_activity_at || b.created_at) - new Date(a.last_activity_at || a.created_at);
}

export async function GET() {
  const user = await getSessionUser();
  const authError = requireUser(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const isAdmin = user.role === "admin";
  const recent = getRecentDemandes(20, isAdmin ? null : user.id);

  const actives = recent.filter((d) => ACTIVE_STATUSES.includes(d.status));
  const history = recent.filter((d) => CLOSED_STATUSES.includes(d.status));

  if (!isAdmin) {
    return NextResponse.json({ actives, history, recent });
  }

  const allDemandes = listAllDemandes();
  const allActives = allDemandes.filter((d) => ACTIVE_STATUSES.includes(d.status));
  const unassignedAll = allActives
    .filter((d) => !d.assigned_to)
    .sort(sortByPriorityThenActivity);
  const highPriorityAll = allActives
    .filter((d) => ["critique", "haute"].includes(d.priorite))
    .sort(sortByPriorityThenActivity);
  const unassigned = unassignedAll.slice(0, 6);
  const highPriority = highPriorityAll.slice(0, 6);
  const clients = listClients({ includeArchived: true });

  return NextResponse.json({
    actives,
    history,
    recent,
    stats: {
      totalDemandes: allDemandes.length,
      actives: allActives.length,
      nonAttribuees: unassignedAll.length,
      prioritaires: highPriorityAll.length,
      clients: clients.length,
      resolues: allDemandes.filter((d) => d.status === "resolue").length,
    },
    unassigned,
    highPriority,
  });
}
