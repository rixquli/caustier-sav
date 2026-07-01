import { Ticket } from "@/types/ticket";
import { db } from "./db";

export type TicketFilter = { idClient?: string; idTechnician?: string };

export function getTickets(filter: TicketFilter): Ticket[] {
  const baseQuery = `
    SELECT
      t.*,
      u.name AS assigned_to_name
    FROM tickets t
    LEFT JOIN user u ON t.assigned_to = u.id
  `;

  const conditions: string[] = [];
  const params: string[] = [];

  if (filter.idClient) {
    conditions.push("t.created_by = ?");
    params.push(filter.idClient);
  }

  if (filter.idTechnician) {
    conditions.push("t.assigned_to = ?");
    params.push(filter.idTechnician);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return db.prepare(`${baseQuery} ${whereClause}`).all(...params) as Ticket[];
}

export function getTicketDetails(id: Ticket["id"]): Ticket {
  return db.prepare(`SELECT * FROM tickets WHERE id = ?`).all(id)[0] as Ticket;
}

export function updateTicket(
  ticket: Omit<Ticket, "created_at" | "created_by">,
): boolean {
  try {
    db.prepare(
      `
      UPDATE tickets
      SET title = ?, description = ?, priority = ?, status = ?, machine_id = ?, assigned_to = ?
      WHERE id = ?
    `,
    ).run(
      ticket.title,
      ticket.description,
      ticket.priority,
      ticket.status,
      ticket.machine_id ?? null,
      ticket.assigned_to ?? null,
      ticket.id,
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export function createTicket(
  ticket: Omit<Ticket, "id" | "created_at">,
): boolean {
  try {
    db.prepare(
      `
      INSERT INTO tickets (title, description, priority, status, machine_id, assigned_to, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      ticket.title,
      ticket.description,
      ticket.priority,
      ticket.status,
      ticket.machine_id ?? null,
      ticket.assigned_to ?? null,
      ticket.created_by,
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
