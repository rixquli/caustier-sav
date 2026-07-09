import type { TechnicienDisplay } from "@/types/technicien";
import type {
  DemandeDisplay,
  DemandePriorite,
  DemandeStatus,
  DemandeType,
} from "./demande";

export type DemandeClientOption = {
  id: string;
  nom?: string | null;
  prenom?: string | null;
  name?: string | null;
  email?: string | null;
};

export type DemandeAdminOption = {
  id: string;
  nom?: string | null;
  prenom?: string | null;
  name?: string | null;
  email?: string | null;
};

export type DemandeMachineOption = {
  id: number;
  nom: string;
};

export type DemandeCreateFormState = {
  userId: string;
  titre: string;
  description: string;
  type: DemandeType | string;
  priorite: DemandePriorite | string;
  machineId: string;
  assignedTo: string;
};

export type DemandeEditFormState = DemandeCreateFormState & {
  status: DemandeStatus | string;
  notesAdmin: string;
};

export type DemandeFiltersState = {
  search: string;
  status: string;
  type: string;
  openOnly: boolean;
  mine: boolean;
  unassigned: boolean;
  late: boolean;
};

export type DemandeFormProps = {
  technicians?: TechnicienDisplay[];
  machines?: DemandeMachineOption[];
  onSuccess?: (demande: DemandeDisplay) => void;
  adminMode?: boolean;
  clients?: DemandeClientOption[];
  admins?: DemandeAdminOption[];
};

export type EditableDemandeFormProps = DemandeFormProps & {
  demande: DemandeDisplay;
};

export type AdminCreateDemandeModalProps = {
  clients: DemandeClientOption[];
  admins: DemandeAdminOption[];
  technicians: TechnicienDisplay[];
  onClose: () => void;
  onCreated?: (demande: DemandeDisplay) => void;
};

export type EditDemandeModalProps = {
  demande: DemandeDisplay | null;
  clients?: DemandeClientOption[];
  admins?: DemandeAdminOption[];
  technicians?: TechnicienDisplay[];
  onClose: () => void;
  onUpdated?: (demande: DemandeDisplay) => void;
};

export type ClientCreateDemandeModalProps = {
  onClose: () => void;
  onCreated?: (demande: DemandeDisplay) => void;
};

export type AdminDemandeTableProps = {
  demandes: DemandeDisplay[];
  clients?: DemandeClientOption[];
  admins?: DemandeAdminOption[];
  technicians?: TechnicienDisplay[];
  currentUserId?: string;
  sortDesc: boolean;
  onToggleSort: () => void;
  onUpdated?: (demande: DemandeDisplay) => void;
  onDeleted?: (id: number) => void;
};

export type AdminDemandeFiltersProps = {
  filters: DemandeFiltersState;
  onChange: (filters: DemandeFiltersState) => void;
};

export type DemandeCardListProps = {
  demandes: DemandeDisplay[];
  detailBasePath?: string;
  showClient?: boolean;
  emptyMessage?: string;
};
