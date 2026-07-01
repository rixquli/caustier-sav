import { NextResponse } from "next/server";

import { createMachine, getMachines } from "@/lib/db/machine";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Machine } from "@/types/machine";
import { updateMachine } from "@/lib/db/machine";

//fetch(`/api/machines?assigned_to=${params.id}`)
export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const assigned_to = searchParams.get("assigned_to");

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }
  const machines = session.user.is_admin
    ? getMachines({ idClient: assigned_to ?? undefined })
    : getMachines({ idClient: session.user.id });
  if (!machines) {
    return NextResponse.json(
      { message: "Machines introuvables" },
      { status: 404 },
    );
  }
  return NextResponse.json(machines);
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
    name,
    type,
    assigned_to,
    number_ligne,
    product,
    version,
    service_date,
    tel_pilote,
    technician_name,
    tel_technician,
    note,
  } = body;

  if (!name) {
    return NextResponse.json({ message: "Le nom est requis" }, { status: 400 });
  }

  const success = createMachine({
    name,
    type,
    assigned_to: assigned_to ?? undefined,
    number_ligne,
    product,
    version,
    service_date,
    tel_pilote,
    technician_name,
    tel_technician,
    note,
  });

  if (!success) {
    return NextResponse.json(
      { message: "Erreur lors de la création de la machine" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Machine créée" }, { status: 201 });
};

export const PUT = async (request: Request) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const body = (await request.json()) as Machine;
  const {
    id,
    name,
    type,
    assigned_to,
    number_ligne,
    product,
    version,
    service_date,
    tel_pilote,
    technician_name,
    tel_technician,
    note,
  } = body;

  if (
    !session.user.is_admin &&
    Number(assigned_to) !== Number(session.user.id)
  ) {
    return NextResponse.json({ message: "Impossible de " }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json(
      { message: "L'id de la machine est requis" },
      { status: 400 },
    );
  }

  const success = updateMachine({
    id,
    name,
    type,
    assigned_to,
    number_ligne,
    product,
    version,
    service_date,
    tel_pilote,
    technician_name,
    tel_technician,
    note,
  });

  if (!success) {
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour de la machine" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Machine mis à jour" }, { status: 200 });
};
