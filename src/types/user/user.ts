/** Rôle applicatif (Better Auth `user.role`). */
export type UserRole = "admin" | "client";

/** Ligne brute telle que retournée par SQLite (`user`, Better Auth). */
export type UserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean | number | null;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
  role: UserRole;
  nom: string | null;
  prenom: string | null;
  phone: string | null;
  adresse: string | null;
  archived: number | boolean | null;
  mustChangePassword: number | boolean | null;
  notes_admin?: string | null;
};

type UserHiddenFields = "emailVerified" | "image";

/** Représentation normalisée pour l'UI et les réponses API. */
export type UserDisplay = Omit<
  UserRow,
  UserHiddenFields | "archived" | "mustChangePassword"
> & {
  archived: boolean;
  mustChangePassword: boolean;
  displayName: string;
};

export type UserId = UserRow["id"] | string;

/** Résumé admin pour assignation / filtres. */
export type AdminUserSummary = Pick<
  UserRow,
  "id" | "name" | "nom" | "prenom" | "email"
>;

export type ListClientsParams = {
  search?: string;
  includeArchived?: boolean;
};

/** Données pour la création d'un compte client. */
export type CreateClientInput = {
  nom: string;
  email: string;
  prenom?: string;
  phone?: string;
  adresse?: string;
  password?: string;
};

/** Mise à jour partielle d'un utilisateur applicatif. */
export type UpdateUserInput = Partial<
  Pick<
    UserRow,
    "nom" | "prenom" | "phone" | "adresse" | "name" | "notes_admin" | "role"
  >
> & {
  archived?: boolean | number;
  mustChangePassword?: boolean | number;
};

export type ClientNoteRow = {
  id: number;
  user_id: string;
  admin_id: string;
  contenu: string;
  created_at: string;
  updated_at: string;
};

export type ClientNoteJoinedRow = ClientNoteRow & {
  auteur_nom: string | null;
  auteur_prenom: string | null;
  auteur_name: string | null;
};

export type CreateClientNoteInput = {
  userId: UserId;
  adminId: UserId;
  contenu: string;
};
