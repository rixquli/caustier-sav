import { Specialite, User } from "@/types/user";
import { query, queryOne } from "./db";

export type UserFilter = {
  id?: number;
  is_admin?: boolean;
  specialite?: Specialite;
};

export async function getUsers(filter: UserFilter): Promise<User[]> {
  const baseQuery = `SELECT * FROM "user"`;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.id) {
    conditions.push(`id = $${params.length + 1}`);
    params.push(filter.id);
  }
  if (filter.is_admin !== undefined) {
    conditions.push(`is_admin = $${params.length + 1}`);
    params.push(filter.is_admin);
  }
  if (filter.specialite !== undefined) {
    conditions.push(`specialite = $${params.length + 1}`);
    params.push(filter.specialite);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return (await query<User>(`${baseQuery} ${whereClause}`, params)) as User[];
}

export async function getUserDetails(id: User["id"]): Promise<User> {
  return (await queryOne<User>(`SELECT * FROM "user" WHERE id = $1`, [
    id,
  ])) as User;
}

export async function updateUser(
  user: Omit<User, "created_at" | "created_by">,
): Promise<boolean> {
  try {
    await query(
      `
      UPDATE "user"
      SET email = $1,
          password = $2,
          name = $3,
          adresse = $4,
          telephone = $5,
          ville = $6,
          pays = $7,
          code_postal = $8,
          note = $9,
          is_admin = $10,
          specialite = $11
      WHERE id = $12
    `,
      [
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
      ],
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function createUser(
  user: Omit<User, "id" | "created_at">,
): Promise<boolean> {
  try {
    await query(
      `INSERT INTO "user" (email, password, name, adresse, telephone, ville, pays, code_postal, note, is_admin, specialite)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
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
      ],
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
