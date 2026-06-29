import { auth } from "@/lib/auth";
import { createTicket, getTickets } from "@/lib/db/tickets";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const tickets = session.user.is_admin
    ? getTickets({})
    : getTickets({ idClient: session.user.id });

  return NextResponse.json(tickets);
};

export const POST = async (request: Request) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, priority, status, machine_id, assigned_to } = body;

  if (!title || !description) {
    return NextResponse.json(
      { message: "Le titre et la description sont requis" },
      { status: 400 },
    );
  }

  const success = createTicket({
    title,
    description,
    priority: priority ?? "Normal",
    status: status ?? "Ouvert",
    machine_id: machine_id ?? undefined,
    assigned_to: assigned_to ?? undefined,
    created_by: session.user.id,
  });

  if (!success) {
    return NextResponse.json(
      { message: "Erreur lors de la création du ticket" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Ticket créé" }, { status: 201 });
};
