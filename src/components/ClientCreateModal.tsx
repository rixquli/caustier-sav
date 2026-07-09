"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import type {
  ApiErrorResponse,
  ClientCreateFormState,
  ClientCreateModalProps,
  CreateClientResponse,
} from "@/types/user";

const EMPTY_FORM: ClientCreateFormState = {
  prenom: "",
  nom: "",
  email: "",
  phone: "",
  adresse: "",
};

export default function ClientCreateModal({
  onClose,
  onCreated,
}: ClientCreateModalProps) {
  const [form, setForm] = useState<ClientCreateFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  function setField<K extends keyof ClientCreateFormState>(
    key: K,
    value: ClientCreateFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as CreateClientResponse | ApiErrorResponse;

      if (!res.ok) {
        setError("error" in data ? data.error : "Erreur lors de la création.");
        return;
      }

      const success = data as CreateClientResponse;
      setTempPassword(success.tempPassword);
      onCreated?.(success.client);
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
            <h2>Nouveau client</h2>
            <p className="modal-header-subtitle">
              Créez un compte client avec mot de passe temporaire
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
                Client créé. Mot de passe temporaire à transmettre :{" "}
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
            <form className="form-card form-card--inline" onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="create-prenom">Prénom</label>
                  <input
                    id="create-prenom"
                    value={form.prenom}
                    onChange={(e) => setField("prenom", e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="create-nom">Nom</label>
                  <input
                    id="create-nom"
                    value={form.nom}
                    onChange={(e) => setField("nom", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="create-email">Email</label>
                  <input
                    id="create-email"
                    type="email"
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
                <label htmlFor="create-adresse">Adresse</label>
                <textarea
                  id="create-adresse"
                  value={form.adresse}
                  onChange={(e) => setField("adresse", e.target.value)}
                  rows={2}
                />
              </div>

              <p className="page-muted">
                Un mot de passe temporaire sera généré automatiquement.
              </p>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Création…" : "Créer le client"}
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
