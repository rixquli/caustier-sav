export type Specialite =
  | "IA"
  | "Electronique"
  | "Mécanique"
  | "Informatique"
  | "Autre";

export const Specialites: Specialite[] = [
  "IA",
  "Electronique",
  "Mécanique",
  "Informatique",
  "Autre",
];

export type User = {
  id: number;
  email: string;
  password: string;
  name: string;
  adresse: string;
  telephone: string;
  ville: string;
  pays: string;
  code_postal: string;
  note: string;
  is_admin: boolean;
  specialite: Specialite;
};
