import type { UserDisplay } from "./user";

export type ClientCreateFormState = {
  prenom: string;
  nom: string;
  email: string;
  phone: string;
  adresse: string;
};

export type ClientEditFormState = ClientCreateFormState & {
  notes_admin: string;
  archived: boolean;
};

export type ClientCreateModalProps = {
  onClose: () => void;
  onCreated?: (client: UserDisplay) => void;
};

export type ClientEditModalProps = {
  client: UserDisplay | null;
  onClose: () => void;
  onUpdated?: (client: UserDisplay) => void;
};
