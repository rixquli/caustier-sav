import type { TechnicienDisplay } from "./technicien";

export type TechnicianCreateFormState = {
  name: string;
  email: string;
  phone: string;
  specialite: string;
  notes: string;
};

export type TechnicianEditFormState = Pick<
  TechnicienDisplay,
  "name" | "email" | "specialite"
> & {
  phone_number: string;
  notes: string;
  notes_admin: string;
  archived: boolean;
};

export type TechnicianCreateModalProps = {
  onClose: () => void;
  onCreated?: (technicien: TechnicienDisplay) => void;
};

export type TechnicianEditModalProps = {
  technicien: TechnicienDisplay | null;
  onClose: () => void;
  onUpdated?: (technicien: TechnicienDisplay) => void;
  onDeleted?: (id: TechnicienDisplay["id"]) => void;
};
