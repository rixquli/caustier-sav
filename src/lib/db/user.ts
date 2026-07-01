import { User } from "@/types/user";
import { db } from "./db";

export type UserFilter = { id?: number; is_admin?: boolean };

export function getUsers(filter: UserFilter): User[] {
  if (filter.id) {
    return db
      .prepare(`SELECT * FROM user WHERE id = ?`)
      .all(filter.id) as User[];
  }
  if (filter.is_admin !== undefined) {
    return db
      .prepare(`SELECT * FROM user WHERE is_admin = ?`)
      .all(filter.is_admin ? 1 : 0) as User[];
  }
  return db.prepare(`SELECT * FROM user`).all() as User[];
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
      SET email = ?, password = ?, name = ?, adresse = ?, telephone = ?, ville = ?, pays = ?, code_postal = ?, note = ?, is_admin = ?
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
      `INSERT INTO user (email, password, name, adresse, telephone, ville, pays, code_postal, note, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
