export enum Specialite {
  IA = "IA",
  Electronique = "Electronique",
  Mécanique = "Mécanique",
  Informatique = "Informatique",
}

export const Specialites: Specialite[] = [
  Specialite.IA,
  Specialite.Electronique,
  Specialite.Mécanique,
  Specialite.Informatique,
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
