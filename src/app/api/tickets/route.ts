import { auth } from "@/lib/auth";
import { createTicket, getTickets, updateTicket } from "@/lib/db/tickets";
import { Ticket } from "@/types/ticket";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const technicianId = searchParams.get("technicianId");

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const tickets = session.user.is_admin
    ? getTickets({
        idClient: clientId ?? undefined,
        idTechnician: technicianId ?? undefined,
      })
    : getTickets({
        idClient: session.user.id,
        idTechnician: technicianId ?? undefined,
      });

  if (!tickets) {
    return NextResponse.json(
      { message: "Tickets introuvables" },
      { status: 404 },
    );
  }

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
  const {
    title,
    description,
    priority,
    status,
    machine_id,
    assigned_to,
    created_by,
  } = body;

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
    created_by: created_by ?? Number(session.user.id),
  });

  if (!success) {
    return NextResponse.json(
      { message: "Erreur lors de la création du ticket" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Ticket créé" }, { status: 201 });
};

export const PUT = async (request: Request) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const body = (await request.json()) as Ticket;
  const {
    id,
    title,
    description,
    priority,
    status,
    machine_id,
    assigned_to,
    created_by,
  } = body;

  if (
    !session.user.is_admin &&
    Number(created_by) !== Number(session.user.id)
  ) {
    return NextResponse.json({ message: "Impossible de " }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json(
      { message: "L'id du ticket est requis" },
      { status: 400 },
    );
  }

  const success = updateTicket({
    id,
    title,
    description,
    priority: priority ?? "Normal",
    status: status ?? "Ouvert",
    machine_id: machine_id ?? undefined,
    assigned_to: assigned_to ?? undefined,
  });

  if (!success) {
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour du ticket" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Ticket mis à jour" }, { status: 200 });
};
