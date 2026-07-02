import { Specialite, User } from "@/types/user";
import { db } from "./db";

export type UserFilter = {
  id?: number;
  is_admin?: boolean;
  specialite?: Specialite;
};

export function getUsers(filter: UserFilter): User[] {
  const baseQuery = `SELECT * FROM user`;
  const conditions: string[] = [];
  const params: string[] = [];

  if (filter.id) {
    conditions.push("id = ?");
    params.push(filter.id.toString());
  }
  if (filter.is_admin !== undefined) {
    conditions.push("is_admin = ?");
    params.push(filter.is_admin ? "1" : "0");
  }
  if (filter.specialite !== undefined) {
    conditions.push("specialite = ?");
    params.push(filter.specialite.toString());
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return db.prepare(`${baseQuery} ${whereClause}`).all(...params) as User[];
}

export function getUserDetails(id: User["id"]): User {
  return db.prepare(`SELECT * FROM user WHERE id = ?`).all(id)[0] as User;
}

export function updateUser(
  user: Omit<User, "created_at" | "created_by">,
): boolean {
  try {
    db.prepare(
      `
      UPDATE user
      SET email = ?, password = ?, name = ?, adresse = ?, telephone = ?, ville = ?, pays = ?, code_postal = ?, note = ?, is_admin = ?, specialite = ?
      WHERE id = ?
    `,
    ).run(
      user.email,
      user.password,
      user.name,
      user.adresse,
      user.telephone,
      user.ville,
      user.pays,
      user.code_postal,
      user.note,
      user.is_admin,
      user.specialite,
      user.id,
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export function createUser(user: Omit<User, "id" | "created_at">): boolean {
  try {
    db.prepare(
      `INSERT INTO user (email, password, name, adresse, telephone, ville, pays, code_postal, note, is_admin, specialite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      user.email,
      user.password,
      user.name,
      user.adresse,
      user.telephone,
      user.ville,
      user.pays,
      user.code_postal,
      user.note,
      user.is_admin,
      user.specialite,
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
