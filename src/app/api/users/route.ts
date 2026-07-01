import { auth } from "@/lib/auth";
import { createUser, getUsers, updateUser } from "@/lib/db/user";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const filterIsAdmin = searchParams.get("is_admin");

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }
  if (!session.user.is_admin) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const users =
    filterIsAdmin !== null
      ? getUsers({ is_admin: filterIsAdmin === "true" })
      : getUsers({});
  if (!users) {
    return NextResponse.json(
      { message: "Utilisateurs introuvables" },
      { status: 404 },
    );
  }
  return NextResponse.json(users);
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
    email,
    password,
    name,
    adresse,
    telephone,
    ville,
    pays,
    code_postal,
    note,
    is_admin,
  } = body;
  if (!email || !password || !name || !adresse) {
    return NextResponse.json(
      { message: "Le nom, l'adresse et l'email sont requis" },
      { status: 400 },
    );
  }
  const success = createUser({
    email,
    password,
    name,
    adresse,
    telephone,
    ville,
    pays,
    code_postal,
    note,
    is_admin,
  });
  if (!success) {
    return NextResponse.json(
      { message: "Erreur lors de la création de l'utilisateur" },
      { status: 500 },
    );
  }
  return NextResponse.json(
    { message: "Utilisateur créé avec succès" },
    { status: 201 },
  );
};

export const PUT = async (request: Request) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }
  if (!session.user.is_admin) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }
  const body = await request.json();
  const { id, ...data } = body;
  const success = updateUser({ id, ...data });
  if (!success) {
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 },
    );
  }
  return NextResponse.json(
    { message: "Utilisateur mis à jour avec succès" },
    { status: 200 },
  );
};
