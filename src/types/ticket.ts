export enum Priority {
  Normal = "Normal",
  Basse = "Basse",
  Haute = "Haute",
  Critique = "Critique",
}
export enum Status {
  Ouvert = "Ouvert",
  Fermé = "Fermé",
}

export enum Type {
  Inconnu = "Inconnu",
  Informatique = "Informatique",
  Electricite = "Electricite",
  Mecanique = "Mecanique",
  Autre = "Autre",
}

export type Ticket = {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  machine_id?: number;
  created_at: string;
  assigned_to?: number;
  assigned_to_name?: string | null;
  created_by: number;
  type: Type;
};
