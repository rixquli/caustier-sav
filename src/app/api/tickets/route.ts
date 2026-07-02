import { Specialite } from "@/types/user";
import { auth } from "@/lib/auth";
import { createTicket, getTickets, updateTicket } from "@/lib/db/tickets";
import { getUserDetails, getUsers } from "@/lib/db/user";
import { sendMessage } from "@/lib/whatsapp/test";
import { Ticket, Type } from "@/types/ticket";
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
    ? await getTickets({
        idClient: clientId ?? undefined,
        idTechnician: technicianId ?? undefined,
      })
    : await getTickets({
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
    type,
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
    type: type ?? Type.IA,
  });

  if (!success) {
    return NextResponse.json(
      { message: "Erreur lors de la création du ticket" },
      { status: 500 },
    );
  }

  let technician;
  switch (type) {
    case Type.Informatique:
      technician = await getUsers({
        is_admin: true,
        specialite: Specialite.Informatique,
      });
      break;
    case Type.Electricite:
      technician = await getUsers({
        is_admin: true,
        specialite: Specialite.Electronique,
      });
      break;
    case Type.Mecanique:
      technician = await getUsers({
        is_admin: true,
        specialite: Specialite.Mécanique,
      });
      break;
    case Type.IA:
      technician = await getUsers({
        is_admin: true,
        specialite: Specialite.IA,
      });
      break;
  }

  const client = await getUserDetails(Number(created_by));

  const selectedTechnician = technician?.[0];

  console.log(`technician: ${selectedTechnician?.telephone}`);
  console.log(`technician: ${selectedTechnician?.name}`);
  console.log(`client: ${client?.name}`);
  console.log(`description: ${description}`);
  console.log(`type: ${type}`);
  console.log(`priority: ${priority}`);

  try {
    sendMessage({
      technicianNumber: selectedTechnician?.telephone ?? "",
      technicianName: selectedTechnician?.name ?? "",
      clientName: client?.name ?? "",
      description: description ?? "",
      type: type ?? "IA",
      priority: priority ?? "Normal",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erreur lors de l'envoi du message" },
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
    type,
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
    type: type ?? "IA",
  });

  if (!success) {
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour du ticket" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Ticket mis à jour" }, { status: 200 });
};
