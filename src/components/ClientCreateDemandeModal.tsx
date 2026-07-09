"use client";

import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import DemandeForm from "@/components/DemandeForm";
import type {
  ClientCreateDemandeModalProps,
  DemandeMachineOption,
} from "@/types/demande";

export default function ClientCreateDemandeModal({
  onClose,
  onCreated,
}: ClientCreateDemandeModalProps) {
  const [machines, setMachines] = useState<DemandeMachineOption[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { machines?: DemandeMachineOption[] } | null) => {
        if (active) setMachines(data?.machines ?? []);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Nouvelle demande</h2>
            <p className="modal-header-subtitle">
              Décrivez votre problème ou votre besoin.
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
          <DemandeForm machines={machines} onSuccess={onCreated} />
        </div>
      </div>
    </div>
  );
}
