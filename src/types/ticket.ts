export type Ticket = {
  id: string;
  title: string;
  description: string;
  machineId?: string;
  priority: "Basse" | "Moyenne" | "Haute" | "Critique";
  statut: "Ouverte" | "En cours" | "Résolu" | "Fermé";
  creationDate: Date;
  assignTo: string;
};
