import type { ClientNoteJoinedRow, UserDisplay } from "./user";

export type ApiErrorResponse = {
  error: string;
};

export type MeResponse = {
  user: UserDisplay;
};

export type ListClientsResponse = {
  clients: UserDisplay[];
};

export type CreateClientRequest = {
  nom: string;
  email: string;
  prenom?: string;
  phone?: string;
  adresse?: string;
  password?: string;
};

export type CreateClientResponse = {
  client: UserDisplay;
  tempPassword: string;
};

export type ClientDetailResponse = {
  client: UserDisplay;
  machines: ClientMachineSummary[];
};

export type ClientMachineSummary = {
  id: number;
  user_id: string;
  nom: string;
  marque: string | null;
  produits_calibres?: string | null;
  version_logiciel?: string | null;
  date_mise_en_service?: string | null;
  pilote_ligne?: string | null;
  technicien_charge?: string | null;
  nombre_lignes?: number | null;
  serveurs_vision?: string | null;
  notes_internes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type UpdateClientRequest = Partial<
  Pick<UserDisplay, "nom" | "prenom" | "email" | "phone" | "adresse" | "notes_admin">
> & {
  archived?: boolean;
  resetPassword?: boolean;
};

export type UpdateClientResponse = {
  client: UserDisplay;
  machines: ClientMachineSummary[];
  tempPassword?: string | null;
};

export type ProfileResponse = {
  user: UserDisplay;
  machines: ClientMachineSummary[];
};

export type UpdateProfileRequest = {
  nom: string;
  prenom?: string;
  phone?: string;
  adresse?: string;
};

export type ListClientNotesResponse = {
  notes: ClientNoteJoinedRow[];
};

export type CreateClientNoteRequest = {
  contenu: string;
};

export type CreateClientNoteResponse = {
  note: ClientNoteJoinedRow;
};

export type SearchClientHit = Pick<UserDisplay, "id" | "displayName" | "email">;

export type SearchFaqHit = {
  id: number;
  question: string;
  categorie: string | null;
};

export type SearchDemandeHit = {
  id: number;
  titre: string;
  status: string;
  client: string;
};

export type SearchResponse = {
  faq: SearchFaqHit[];
  demandes: SearchDemandeHit[];
  clients: SearchClientHit[];
};
