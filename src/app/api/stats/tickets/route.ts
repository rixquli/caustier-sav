// app/api/stats/tickets/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/db";
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

  const statsByStatus = db
    .prepare(
      `
            SELECT status, COUNT(*) as count
            FROM tickets
            GROUP BY status
        `,
    )
    .all() as { status: Status; count: number }[];

  const statsByPriority = db
    .prepare(
      `
            SELECT priority, COUNT(*) as count
            FROM tickets
            GROUP BY priority
        `,
    )
    .all() as { priority: Priority; count: number }[];

  const totalOpen = db
    .prepare(`SELECT COUNT(*) as count FROM tickets WHERE status = 'Ouvert'`)
    .get() as { count: number };

  // const avgResolutionTime = db
  //   .prepare(
  //     `
  //           SELECT AVG(julianday(resolved_at) - julianday(created_at)) as avg_days
  //           FROM tickets
  //           WHERE resolved_at IS NOT NULL
  //       `,
  //   )
  //   .get() as { avg_days: number };

  const totalUnassigned = db
    .prepare(
      `SELECT COUNT(*) as count FROM tickets WHERE status = 'Ouvert' AND assigned_to IS NULL`,
    )
    .get() as { count: number };

  const totalClients = db
    .prepare(`SELECT COUNT(*) as count FROM user WHERE is_admin = false`)
    .get() as { count: number };

  const stats: Stats = {
    statsByStatus: statsByStatus.map(
      (item: { status: Status; count: number }) => ({
        status: item.status as Status,
        count: item.count as number,
      }),
    ),
    statsByPriority: statsByPriority.map(
      (item: { priority: Priority; count: number }) => ({
        priority: item.priority as Priority,
        count: item.count as number,
      }),
    ),
    totalOpen: totalOpen.count as number,
    // avgResolutionTime: avgResolutionTime.avg_days as unknown as number,
    totalClients: totalClients.count as number,
    totalUnassigned: totalUnassigned.count as number,
  };

  return NextResponse.json(stats);
}
