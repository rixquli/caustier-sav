// app/api/stats/tickets/route.ts
import { auth } from "@/lib/auth";
import { query, queryOne } from "@/lib/db/db";
import { Priority, Status } from "@/types/ticket";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export type Stats = {
  statsByStatus: { status: Status; count: number }[];
  statsByPriority: { priority: Priority; count: number }[];
  totalOpen: number;
  // avgResolutionTime: number;
  totalClients: number;
  totalUnassigned: number;
};

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user.is_admin) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const statsByStatus = await query<{ status: Status; count: number }>(
    `
            SELECT status, COUNT(*) as count
            FROM tickets
            GROUP BY status
        `,
  );

  const statsByPriority = await query<{ priority: Priority; count: number }>(
    `
            SELECT priority, COUNT(*) as count
            FROM tickets
            GROUP BY priority
        `,
  );

  const totalOpen = (await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM tickets WHERE status = 'Ouvert'`,
  )) as { count: number };

  const totalUnassigned = (await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM tickets WHERE status = 'Ouvert' AND assigned_to IS NULL`,
  )) as { count: number };

  const totalClients = (await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM "user" WHERE is_admin = false`,
  )) as { count: number };

  const stats: Stats = {
    statsByStatus: statsByStatus.map((item) => ({
      status: item.status as Status,
      count: item.count,
    })),
    statsByPriority: statsByPriority.map((item) => ({
      priority: item.priority as Priority,
      count: item.count,
    })),
    totalOpen: totalOpen.count,
    totalClients: totalClients.count,
    totalUnassigned: totalUnassigned.count,
  };

  return NextResponse.json(stats);
}
