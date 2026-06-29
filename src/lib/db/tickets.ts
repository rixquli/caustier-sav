import { db } from "./db";

export type Priority = "Normal" | "Basse" | "Haute" | "Critique";
export type Status = "Ouvert" | "Fermé";

export type Ticket = {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  machine_id?: string;
  created_at?: string;
  assigned_to?: string;
  created_by: string;
};

export type TicketFilter = { idClient?: string };

export function getTickets(filter: TicketFilter): Ticket[] {
  if (filter.idClient) {
    return db
      .prepare(`SELECT * FROM tickets WHERE created_by = ?`)
      .all(filter.idClient) as Ticket[];
  }
  return db.prepare(`SELECT * FROM tickets`).all() as Ticket[];
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
