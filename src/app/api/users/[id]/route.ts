import { auth } from "@/lib/auth";
import { getUserDetails } from "@/lib/db/user";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  if (!session.user.is_admin && Number(id) !== Number(session.user.id)) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const user = getUserDetails(Number(id));
  if (!user) {
    return NextResponse.json(
      { message: "Utilisateur introuvable" },
      { status: 404 },
    );
  }
  return NextResponse.json(user);
};
