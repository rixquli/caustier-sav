/** Valeurs connues pour le champ `type`. */
export type DemandeType = "SAV" | "IA" | "QUESTION" | "AUTRE";

/** Valeurs connues pour le champ `priorite`. */
export type DemandePriorite = "faible" | "normale" | "haute" | "critique";

/** Valeurs connues pour le champ `status`. */
export type DemandeStatus =
  | "nouvelle"
  | "en_cours"
  | "en_attente_client"
  | "resolue"
  | "fermee";

/** Ligne brute telle que retournée par SQLite (`demandes`). */
export type DemandeRow = {
  id: number;
  user_id: string;
  machine_id: number | null;
  titre: string;
  description: string;
  type: DemandeType | string;
  priorite: DemandePriorite | string;
  status: DemandeStatus | string;
  assigned_to: string | null;
  created_at: string;
  last_activity_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  read_by_client: 0 | 1;
  read_by_admin: 0 | 1;
  notes_admin: string | null;
  closed_message: string | null;
};

/** Champs issus des JOIN sur client, technicien et machine. */
export type DemandeJoinRow = {
  client_nom: string | null;
  client_prenom: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_adresse: string | null;
  client_notes_admin: string | null;
  assignee_name: string | null;
  machine_nom: string | null;
};

/** Ligne retournée par les requêtes avec JOIN (`DEMANDE_SELECT`). */
export type DemandeRowJoined = DemandeRow & DemandeJoinRow;

type DemandeHiddenFields =
  | "created_at"
  | "last_activity_at"
  | "resolved_at"
  | "closed_at"
  | "read_by_client"
  | "read_by_admin";

/** Représentation normalisée pour l'UI et les réponses API. */
export type DemandeDisplay = Omit<DemandeRow, DemandeHiddenFields> &
  DemandeJoinRow & {
    createdAt: string;
    lastActivityAt: string;
    resolvedAt: string | null;
    closedAt: string | null;
    readByClient: boolean;
    readByAdmin: boolean;
    closedMessage: string | null;
    userId: string;
    machineId: number | null;
    assignedTo: string | null;
    notesAdmin: string | null;
    /** Alias legacy snake_case conservés pour compatibilité UI. */
    created_at: string;
    last_activity_at: string;
    resolved_at: string | null;
    closed_at: string | null;
    user_id: string;
    machine_id: number | null;
    assigned_to: string | null;
    notes_admin: string | null;
    closed_message: string | null;
  };

export type DemandeId = DemandeRow["id"] | string;

export type ListDemandesParams = {
  search?: string;
  page?: number;
  limit?: number;
};

export type DemandeListPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type DemandeListResult = {
  rows: DemandeRowJoined[];
  pagination: DemandeListPagination;
};

export type CreateDemandeInput = Pick<
  DemandeRow,
  "titre" | "description" | "type" | "priorite"
> & {
  userId: string;
  machineId?: number | null;
  assignedTo?: string | null;
  actorId?: string | null;
};

export type UpdateDemandeInput = Partial<
  Pick<
    DemandeRow,
    | "titre"
    | "description"
    | "type"
    | "priorite"
    | "status"
    | "assigned_to"
    | "machine_id"
    | "user_id"
    | "notes_admin"
    | "read_by_client"
    | "read_by_admin"
    | "closed_message"
  >
> & {
  assignedTo?: string | null;
  machineId?: number | null;
  userId?: string;
  notesAdmin?: string | null;
  readByClient?: boolean;
  readByAdmin?: boolean;
  closedMessage?: string | null;
};

export type DemandeMessageRow = {
  id: number;
  demande_id: number;
  user_id: string;
  contenu: string;
  created_at: string;
  auteur_nom: string | null;
  auteur_prenom: string | null;
  auteur_name: string | null;
  auteur_role: string | null;
};

export type DemandeNoteRow = {
  id: number;
  demande_id: number;
  user_id: string;
  contenu: string;
  created_at: string;
  updated_at: string;
  auteur_nom: string | null;
  auteur_prenom: string | null;
  auteur_name: string | null;
};

export type DemandeActivityRow = {
  id: number;
  demande_id: number;
  user_id: string | null;
  action: string;
  details: string | null;
  is_public: 0 | 1;
  created_at: string;
  user_nom: string | null;
  user_prenom: string | null;
  user_name: string | null;
  user_role: string | null;
};

export type CreateDemandeNoteInput = {
  demandeId: number;
  userId: string;
  contenu: string;
};

export type CreateDemandeMessageInput = {
  demandeId: number;
  userId: string;
  contenu: string;
};

export type LogDemandeActivityInput = {
  demandeId: number;
  userId?: string | null;
  action: string;
  details?: Record<string, unknown> | null;
  isPublic?: boolean;
};
