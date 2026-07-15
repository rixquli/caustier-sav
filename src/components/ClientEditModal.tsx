"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiX } from "react-icons/fi";
import type {
  ApiErrorResponse,
  ClientDetailResponse,
  ClientEditFormState,
  ClientEditModalProps,
  UpdateClientRequest,
  UpdateClientResponse,
} from "@/types/user";

const EMPTY_FORM: ClientEditFormState = {
  prenom: "",
  nom: "",
  email: "",
  phone: "",
  adresse: "",
  notes_admin: "",
  archived: false,
};

export default function ClientEditModal({
  client,
  onClose,
  onUpdated,
}: ClientEditModalProps) {
  const [form, setForm] = useState<ClientEditFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const clientId = client?.id;

  useEffect(() => {
    if (!clientId) return;
    let active = true;
    setLoading(true);
    setError("");
    setMessage("");
    setTempPassword("");

    fetch(`/api/clients/${clientId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ClientDetailResponse | null) => {
        if (!active) return;
        const c = data?.client ?? client;
        setForm({
          prenom: c.prenom ?? "",
          nom: c.nom ?? "",
          email: c.email ?? "",
          phone: c.phone ?? "",
          adresse: c.adresse ?? "",
          notes_admin: c.notes_admin ?? "",
          archived: Boolean(c.archived),
        });
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [clientId, client]);

  if (!client) return null;

  function setField<K extends keyof ClientEditFormState>(
    key: K,
    value: ClientEditFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function patch(
    body: UpdateClientRequest,
    successMsg?: string,
  ): Promise<UpdateClientResponse | null> {
    setError("");
    setMessage("");
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as UpdateClientResponse | ApiErrorResponse;
    if (!res.ok) {
      setError("error" in data ? data.error : "Une erreur est survenue.");
      return null;
    }
    const success = data as UpdateClientResponse;
    if (successMsg) setMessage(successMsg);
    onUpdated?.(success.client);
    return success;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await patch(form, "Client mis à jour.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!confirm("Réinitialiser le mot de passe de ce client ?")) return;
    const data = await patch(
      { resetPassword: true },
      "Mot de passe réinitialisé.",
    );
    if (data?.tempPassword) setTempPassword(data.tempPassword);
  }

  async function handleArchive() {
    const next = !form.archived;
    const data = await patch(
      { archived: next },
      next ? "Client archivé." : "Client désarchivé.",
    );
    if (data) setField("archived", next);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card modal-card--wide"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Modifier le client</h2>
            <p className="modal-header-subtitle">
              {[client.prenom, client.nom].filter(Boolean).join(" ") ||
                client.displayName ||
                client.email}
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
          {loading ? (
            <p className="page-muted" style={{ padding: "1.5rem" }}>
              Chargement…
            </p>
          ) : (
            <form className="form-card form-card--inline" onSubmit={handleSave}>
              {error && <div className="alert alert-error">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}
              {tempPassword && (
                <div className="alert alert-info">
                  Nouveau mot de passe temporaire :{" "}
                  <strong>{tempPassword}</strong>
                </div>
              )}

              {form.archived && (
                <div
                  className="alert alert-error"
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    color: "#475569",
                  }}
                >
                  Ce client est archivé.
                </div>
              )}

              <div className="form-row">
                <div className="form-field">
                  <label>Prénom</label>
                  <input
                    value={form.prenom}
                    onChange={(e) => setField("prenom", e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Nom</label>
                  <input
                    value={form.nom}
                    onChange={(e) => setField("nom", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Téléphone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Adresse</label>
                <textarea
                  value={form.adresse}
                  onChange={(e) => setField("adresse", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="form-field">
                <label>Notes internes admin</label>
                <textarea
                  value={form.notes_admin}
                  onChange={(e) => setField("notes_admin", e.target.value)}
                  rows={4}
                  placeholder="Contexte, consignes particulières… Visible uniquement par les administrateurs."
                />
              </div>

              <div className="modal-actions">
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleResetPassword}
                  >
                    Réinitialiser le mot de passe
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleArchive}
                  >
                    {form.archived ? "Désarchiver" : "Archiver"}
                  </button>
                </div>
                <Link
                  href={`/admin/clients/${clientId}`}
                  className="btn btn-secondary"
                >
                  Fiche complète &amp; machines
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
