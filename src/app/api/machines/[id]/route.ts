import { getMachine } from "@/lib/db/machine";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const machine = getMachine(Number(id));

  if (!machine) {
    return NextResponse.json(
      { message: "Machine introuvable" },
      { status: 404 },
    );
  }

  return NextResponse.json(machine);
}
