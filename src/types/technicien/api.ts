import type { TechnicienDisplay, TechnicienNoteRow } from "./technicien";

export type ApiErrorResponse = {
  error: string;
};

export type ListTechniciansResponse = {
  techniciens: TechnicienDisplay[];
};

export type CreateTechnicienRequest = {
  name: string;
  email: string;
  phone?: string;
  specialite?: string;
  notes?: string;
};

export type CreateTechnicienResponse = {
  technicien: TechnicienDisplay;
  tempPassword?: string;
  emailSent?: boolean;
};

export type TechnicienDetailResponse = {
  technicien: TechnicienDisplay;
  machines: TechnicienMachineSummary[];
};

export type TechnicienMachineSummary = {
  id: number;
  user_id: string;
  nom: string;
  marque: string | null;
};

export type UpdateTechnicienRequest = Partial<
  Pick<TechnicienDisplay, "name" | "email" | "specialite" | "notes_admin">
> & {
  phone_number?: string;
  notes_technicien?: string | null;
  archived?: boolean;
};

export type UpdateTechnicienResponse = {
  technicien: TechnicienDisplay;
};

export type DeleteTechnicienResponse = {
  technicien: TechnicienDisplay;
};

export type ListTechnicienNotesResponse = {
  notes: TechnicienNoteRow[];
};

export type CreateTechnicienNoteRequest = {
  contenu: string;
};

export type CreateTechnicienNoteResponse = {
  note: TechnicienNoteRow;
};
