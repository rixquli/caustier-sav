import type {
  DemandeActivityRow,
  DemandeDisplay,
  DemandeMessageRow,
  DemandeNoteRow,
  DemandePriorite,
  DemandeType,
} from "./demande";

export type ApiErrorResponse = {
  error: string;
};

export type ListDemandesPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListDemandesResponse = {
  demandes: DemandeDisplay[];
  pagination?: ListDemandesPagination;
};

export type CreateDemandeRequest = {
  titre: string;
  description: string;
  type: DemandeType | string;
  priorite: DemandePriorite | string;
  machineId?: number | null;
  userId?: string;
  assignedTo?: string | null;
};

export type CreateDemandeResponse = {
  demande: DemandeDisplay;
};

export type UpdateDemandeRequest = Partial<
  Pick<
    DemandeDisplay,
    "titre" | "description" | "type" | "priorite" | "status" | "notes_admin"
  >
> & {
  userId?: string;
  user_id?: string;
  assignedTo?: string | null;
  assigned_to?: string | null;
  machineId?: number | null;
  machine_id?: number | null;
  notesAdmin?: string | null;
  closed_message?: string | null;
  closedMessage?: string | null;
};

export type UpdateDemandeResponse = {
  demande: DemandeDisplay;
};

export type DeleteDemandeResponse = {
  ok: true;
};

export type DemandeDetailResponse = {
  demande: DemandeDisplay;
  messages: DemandeMessageRow[];
  notes: DemandeNoteRow[];
  activity: DemandeActivityRow[];
};

export type ListDemandeNotesResponse = {
  notes: DemandeNoteRow[];
};

export type CreateDemandeNoteRequest = {
  contenu: string;
};

export type CreateDemandeNoteResponse = {
  note: DemandeNoteRow;
};

export type UpdateDemandeNoteRequest = {
  noteId: number;
  contenu: string;
};

export type UpdateDemandeNoteResponse = {
  note: DemandeNoteRow;
};

export type DeleteDemandeNoteResponse = {
  success: true;
};

export type CreateDemandeMessageRequest = {
  contenu: string;
};

export type CreateDemandeMessageResponse = {
  message: DemandeMessageRow;
};

export type ListDemandeActivityResponse = {
  activity: DemandeActivityRow[];
};

export type DemandeMetaPerson = {
  id: string;
  name?: string | null;
  nom?: string | null;
  prenom?: string | null;
  email?: string | null;
  specialite?: string | null;
  telephone?: string | null;
};

export type DemandeMetaResponse = {
  clients: DemandeMetaPerson[];
  admins: DemandeMetaPerson[];
  technicians: DemandeMetaPerson[];
};
