import { NextResponse } from "next/server";
import {
  createMachine,
  deleteMachine,
  findAppUserById,
  getMachineById,
  listMachinesForUser,
  updateMachine,
} from "@/db/db";
import { getSessionUser, guardAdmin, authErrorResponse } from "@/lib/session";
import type { ApiErrorResponse, ClientMachineSummary } from "@/types/user";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type MachineInput = Partial<ClientMachineSummary> & {
  nom: string;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<
  NextResponse<{ machines: ClientMachineSummary[] } | ApiErrorResponse>
> {
  const sessionUser = await getSessionUser();
  const auth = guardAdmin(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  const { id } = await params;
  const client = await findAppUserById(id);
  if (!client || client.role !== "client") {
    return NextResponse.json(
      { error: "Client introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    machines: (await listMachinesForUser(id)) as ClientMachineSummary[],
  });
}

export async function POST(
  request: Request,
  { params }: RouteContext,
): Promise<
  NextResponse<{ machine: ClientMachineSummary } | ApiErrorResponse>
> {
  const sessionUser = await getSessionUser();
  const auth = guardAdmin(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  const { id } = await params;
  const client = await findAppUserById(id);
  if (!client || client.role !== "client") {
    return NextResponse.json(
      { error: "Client introuvable." },
      { status: 404 },
    );
  }

  try {
    const body = (await request.json()) as MachineInput;
    if (!body.nom?.trim()) {
      return NextResponse.json(
        { error: "Le nom est obligatoire." },
        { status: 400 },
      );
    }

    const machine = (await createMachine(id, body)) as ClientMachineSummary;
    return NextResponse.json({ machine }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
): Promise<
  NextResponse<{ machine: ClientMachineSummary | undefined } | ApiErrorResponse>
> {
  const sessionUser = await getSessionUser();
  const auth = guardAdmin(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  const { id: clientId } = await params;
  const body = (await request.json()) as MachineInput & { machineId: number };
  const { machineId, ...data } = body;

  const machine = (await getMachineById(machineId)) as
    | ClientMachineSummary
    | undefined;
  if (!machine || machine.user_id !== clientId) {
    return NextResponse.json(
      { error: "Machine introuvable." },
      { status: 404 },
    );
  }

  if (!data.nom?.trim()) {
    return NextResponse.json(
      { error: "Le nom est obligatoire." },
      { status: 400 },
    );
  }

  const updated = (await updateMachine(machineId, data)) as ClientMachineSummary;
  return NextResponse.json({ machine: updated });
}

export async function DELETE(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse<{ success: boolean } | ApiErrorResponse>> {
  const sessionUser = await getSessionUser();
  const auth = guardAdmin(sessionUser);
  if (!auth.ok) return authErrorResponse(auth.error);

  const { id: clientId } = await params;
  const { searchParams } = new URL(request.url);
  const machineId = Number(searchParams.get("machineId"));

  const machine = (await getMachineById(machineId)) as
    | ClientMachineSummary
    | undefined;
  if (!machine || machine.user_id !== clientId) {
    return NextResponse.json(
      { error: "Machine introuvable." },
      { status: 404 },
    );
  }

  await deleteMachine(machineId);
  return NextResponse.json({ success: true });
}
