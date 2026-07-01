import { getTicketDetails } from "@/lib/db/tickets";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ticket = getTicketDetails(Number(id));

  if (!ticket) {
    return NextResponse.json(
      { message: "Ticket introuvable" },
      { status: 404 },
    );
  }

  return NextResponse.json(ticket);
}
