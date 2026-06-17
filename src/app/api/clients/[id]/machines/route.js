import { NextResponse } from "next/server";
import {
  createMachine,
  deleteMachine,
  findAppUserById,
  getMachineById,
  listMachinesForUser,
  updateMachine,
} from "@/db/db";
import { getSessionUser, requireAdmin } from "@/lib/session";

export async function GET(_request, { params }) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id } = await params;
  const client = findAppUserById(id);
  if (!client || client.role !== "client") {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  }

  return NextResponse.json({ machines: listMachinesForUser(id) });
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id } = await params;
  const client = findAppUserById(id);
  if (!client || client.role !== "client") {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  }

  try {
    const body = await request.json();
    if (!body.nom?.trim()) {
      return NextResponse.json({ error: "Le nom est obligatoire." }, { status: 400 });
    }

    const machine = createMachine(id, body);
    return NextResponse.json({ machine }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id: clientId } = await params;
  const body = await request.json();
  const { machineId, ...data } = body;

  const machine = getMachineById(machineId);
  if (!machine || machine.user_id !== clientId) {
    return NextResponse.json({ error: "Machine introuvable." }, { status: 404 });
  }

  if (!data.nom?.trim()) {
    return NextResponse.json({ error: "Le nom est obligatoire." }, { status: 400 });
  }

  const updated = updateMachine(machineId, data);
  return NextResponse.json({ machine: updated });
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  const authError = requireAdmin(user);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { id: clientId } = await params;
  const { searchParams } = new URL(request.url);
  const machineId = Number(searchParams.get("machineId"));

  const machine = getMachineById(machineId);
  if (!machine || machine.user_id !== clientId) {
    return NextResponse.json({ error: "Machine introuvable." }, { status: 404 });
  }

  deleteMachine(machineId);
  return NextResponse.json({ success: true });
}
