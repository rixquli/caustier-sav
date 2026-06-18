import { FiX } from "react-icons/fi";
import EditableDemandeForm from "./EditableDemandeForm";

export function EditDemandeModal({
  demande,
  clients = [],
  admins = [],
  onClose,
  onUpdated,
}) {
  if (!demande) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card modal-card--wide"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Gérer la demande</h2>
            <p className="modal-header-subtitle">
              #{demande.id} · {demande.titre}
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
        <div className="modal-form">
          <EditableDemandeForm
            adminMode
            demande={demande}
            clients={clients}
            admins={admins}
            onSuccess={onUpdated}
          />
        </div>
      </div>
    </div>
  );
}
