"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import DemandeForm from "@/components/DemandeForm";

export default function AdminCreateDemandeModal({ clients, admins, onClose, onCreated }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" role="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Nouvelle requête</h2>
            <p className="modal-header-subtitle">
              Créer une demande SAV pour un client
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            <FiX aria-hidden="true" />
          </button>
        </div>
        <div className="modal-form">
          <DemandeForm
            adminMode
            clients={clients}
            admins={admins}
            machines={[]}
            onSuccess={onCreated}
          />
        </div>
      </div>
    </div>
  );
}
