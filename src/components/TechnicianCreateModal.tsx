"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import type {
  ApiErrorResponse,
  CreateTechnicienResponse,
  TechnicianCreateFormState,
  TechnicianCreateModalProps,
} from "@/types/technicien";

const EMPTY_FORM: TechnicianCreateFormState = {
  name: "",
  email: "",
  phone: "",
  specialite: "",
  notes: "",
};

export default function TechnicianCreateModal({
  onClose,
  onCreated,
}: TechnicianCreateModalProps) {
  const [form, setForm] = useState<TechnicianCreateFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  function setField<K extends keyof TechnicianCreateFormState>(
    key: K,
    value: TechnicianCreateFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/techniciens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as
        | CreateTechnicienResponse
        | ApiErrorResponse;

      if (!res.ok) {
        setError(
          "error" in data ? data.error : "Erreur lors de la création.",
        );
        return;
      }

      const success = data as CreateTechnicienResponse;
      if (success.tempPassword) {
        setTempPassword(success.tempPassword);
      }
      onCreated?.(success.technicien);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

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
            <h2>Nouveau technicien</h2>
            <p className="modal-header-subtitle">
              Créez un compte technicien avec mot de passe temporaire
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
          {tempPassword ? (
            <div style={{ padding: "0 0 0.5rem" }}>
              <div className="alert alert-success">
                Technicien créé. Mot de passe temporaire à transmettre :{" "}
                <strong>{tempPassword}</strong>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
              >
                Fermer
              </button>
            </div>
          ) : (
            <form
              className="form-card form-card--inline"
              onSubmit={handleSubmit}
            >
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="create-name">Nom</label>
                  <input
                    id="create-name"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="create-specialite">Spécialité</label>
                  <input
                    id="create-specialite"
                    value={form.specialite}
                    onChange={(e) => setField("specialite", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="create-email">Email</label>
                  <input
                    id="create-email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="create-phone">Téléphone</label>
                  <input
                    id="create-phone"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="create-notes">Notes</label>
                <textarea
                  id="create-notes"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Création…" : "Créer le technicien"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
