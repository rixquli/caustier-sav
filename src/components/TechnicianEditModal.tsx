"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiX } from "react-icons/fi";
import type {
  ApiErrorResponse,
  TechnicianEditFormState,
  TechnicianEditModalProps,
  TechnicienDetailResponse,
  UpdateTechnicienRequest,
  UpdateTechnicienResponse,
} from "@/types/technicien";

const EMPTY_FORM: TechnicianEditFormState = {
  name: "",
  email: "",
  phone_number: "",
  specialite: "",
  notes: "",
  notes_admin: "",
  archived: false,
};

export default function TechnicianEditModal({
  technicien,
  onClose,
  onUpdated,
}: TechnicianEditModalProps) {
  const [form, setForm] = useState<TechnicianEditFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const technicianId = technicien?.id;

  useEffect(() => {
    if (!technicianId) return;
    let active = true;
    setLoading(true);
    setError("");
    setMessage("");

    fetch(`/api/techniciens/${technicianId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TechnicienDetailResponse | null) => {
        if (!active) return;
        const t = data?.technicien ?? technicien;
        if (!t) return;

        setForm({
          name: t.name ?? "",
          email: t.email ?? "",
          phone_number: t.phone_number ?? t.telephone ?? "",
          specialite: t.specialite ?? "",
          notes: t.notes ?? "",
          notes_admin: t.notes_admin ?? "",
          archived: t.archived ?? false,
        });
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [technicianId, technicien]);

  if (!technicien) return null;

  function setField<K extends keyof TechnicianEditFormState>(
    key: K,
    value: TechnicianEditFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function patch(
    body: UpdateTechnicienRequest,
    successMsg?: string,
  ): Promise<UpdateTechnicienResponse | null> {
    setError("");
    setMessage("");
    const res = await fetch(`/api/techniciens/${technicianId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as
      | UpdateTechnicienResponse
      | ApiErrorResponse;

    if (!res.ok) {
      setError("error" in data ? data.error : "Une erreur est survenue.");
      return null;
    }
    const success = data as UpdateTechnicienResponse;
    if (successMsg) setMessage(successMsg);
    onUpdated?.(success.technicien);
    return success;
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await patch(
        {
          name: form.name,
          email: form.email,
          specialite: form.specialite,
          phone_number: form.phone_number,
          notes_admin: form.notes_admin,
        },
        "Technicien mis à jour.",
      );
    } finally {
      setSaving(false);
    }
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
            <h2>Modifier le technicien</h2>
            <p className="modal-header-subtitle">{technicien.name}</p>
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
              {form.archived && (
                <div
                  className="alert alert-error"
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    color: "#475569",
                  }}
                >
                  Ce technicien est archivé.
                </div>
              )}

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="edit-name">Nom</label>
                  <input
                    id="edit-name"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="edit-specialite">Spécialité</label>
                  <input
                    id="edit-specialite"
                    value={form.specialite}
                    onChange={(e) => setField("specialite", e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="edit-email">Email</label>
                  <input
                    id="edit-email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="edit-phone">Téléphone</label>
                  <input
                    id="edit-phone"
                    value={form.phone_number}
                    onChange={(e) => setField("phone_number", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="edit-notes-admin">Notes internes admin</label>
                <textarea
                  id="edit-notes-admin"
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
                </div>
                <Link
                  href={`/admin/techniciens/${technicianId}`}
                  className="btn btn-secondary"
                >
                  Fiche complète &amp; notes
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
