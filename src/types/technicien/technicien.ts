/** Ligne brute telle que retournée par SQLite/Postgres (`techniciens`). */
export type TechnicienRow = {
  id: number;
  user_id: string | null;
  name: string;
  specialite: string;
  telephone: string;
  email: string;
  created_at: string;
  updated_at: string;
  notes_technicien: string | null;
};

/** Champs sensibles ou internes exclus de l'affichage public. */
type TechnicienHiddenFields = "created_at" | "updated_at" | "notes_technicien";

/** Représentation normalisée pour l'UI et les réponses API. */
export type TechnicienDisplay = Omit<
  TechnicienRow,
  TechnicienHiddenFields | "telephone" | "user_id"
> & {
  userId: string | null;
  telephone: string;
  /** Alias utilisé par certaines vues legacy. */
  phone_number: string;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  notes_admin: string | null;
  displayName: string;
  archived?: boolean;
  mustChangePassword?: boolean;
};

export type TechnicienNoteRow = {
  id: number;
  technicien_id: string;
  contenu: string;
  created_at: string;
  updated_at: string;
};

export type TechnicienId = TechnicienRow["id"] | string;

export type ListTechniciansParams = {
  search?: string;
};

/** Données minimales pour la création (champs requis + optionnels). */
export type CreateTechnicienInput = Pick<TechnicienRow, "name" | "email"> & {
  specialite?: string;
  phone?: string;
  notes?: string;
  userId?: string | null;
};

/** Mise à jour partielle avec alias de champs API/UI. */
export type UpdateTechnicienInput = Partial<
  Pick<TechnicienRow, "name" | "specialite" | "email" | "notes_technicien" | "user_id">
> & {
  phone?: string;
  phone_number?: string;
  userId?: string | null;
  archived?: boolean;
};

export type CreateTechnicienNoteInput = Pick<
  TechnicienNoteRow,
  "technicien_id" | "contenu"
>;
