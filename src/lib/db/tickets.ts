import { Ticket } from "@/types/ticket";
import { query, queryOne } from "./db";

export type TicketFilter = { idClient?: string; idTechnician?: string };

export async function getTickets(filter: TicketFilter): Promise<Ticket[]> {
  const baseQuery = `
    SELECT
      t.*,
      u.name AS assigned_to_name
    FROM tickets t
    LEFT JOIN "user" u ON t.assigned_to = u.id
  `;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.idClient) {
    conditions.push(`t.created_by = $${params.length + 1}`);
    params.push(Number(filter.idClient));
  }

  if (filter.idTechnician) {
    conditions.push(`t.assigned_to = $${params.length + 1}`);
    params.push(Number(filter.idTechnician));
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return (await query<Ticket>(`${baseQuery} ${whereClause}`, params)) as Ticket[];
}

export async function getTicketDetails(id: Ticket["id"]): Promise<Ticket> {
  return (await queryOne<Ticket>(`SELECT * FROM tickets WHERE id = $1`, [
    id,
  ])) as Ticket;
}

export async function updateTicket(
  ticket: Omit<Ticket, "created_at" | "created_by">,
): Promise<boolean> {
  try {
    await query(
      `
      UPDATE tickets
      SET title = $1,
          description = $2,
          priority = $3,
          status = $4,
          machine_id = $5,
          assigned_to = $6
      WHERE id = $7
    `,
      [
        ticket.title,
        ticket.description,
        ticket.priority,
        ticket.status,
        ticket.machine_id ?? null,
        ticket.assigned_to ?? null,
        ticket.id,
      ],
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function createTicket(
  ticket: Omit<Ticket, "id" | "created_at">,
): Promise<boolean> {
  try {
    await query(
      `
      INSERT INTO tickets (title, description, priority, status, machine_id, assigned_to, created_by, type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        ticket.title,
        ticket.description,
        ticket.priority,
        ticket.status,
        ticket.machine_id ?? null,
        ticket.assigned_to ?? null,
        ticket.created_by,
        ticket.type,
      ],
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
