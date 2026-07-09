"use client";

import { FiX } from "react-icons/fi";
import DemandeForm from "@/components/DemandeForm";
import type { AdminCreateDemandeModalProps } from "@/types/demande";

export default function AdminCreateDemandeModal({
  clients,
  admins,
  technicians,
  onClose,
  onCreated,
}: AdminCreateDemandeModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Nouvelle requête</h2>
            <p className="modal-header-subtitle">
              Créer une demande SAV pour un client
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
          <DemandeForm
            adminMode
            clients={clients}
            admins={admins}
            technicians={technicians}
            machines={[]}
            onSuccess={onCreated}
          />
        </div>
      </div>
    </div>
  );
}
