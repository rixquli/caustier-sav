import { FiX } from "react-icons/fi";
import CloseDemandeForm from "./CloseDemandeForm";
import type { DemandeCloseModalProps } from "@/types/demande/forms";

export function CloseDemandeModal({
  demande,
  onClose,
  onUpdated,
}: DemandeCloseModalProps) {
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
            <h2>Clôturer la demande</h2>
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
          <CloseDemandeForm
            demande={demande}
            onSuccess={(updated) => onUpdated?.(updated)}
          />
        </div>
      </div>
    </div>
  );
}
