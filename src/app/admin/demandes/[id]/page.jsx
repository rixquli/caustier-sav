"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import {
  DEMANDE_PRIORITES,
  DEMANDE_STATUTS,
  DEMANDE_TYPES,
  getPrioriteLabel,
  getStatutInfo,
  getTypeLabel,
} from "@/lib/constants";

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("fr-FR");
}

function formatActivity(entry) {
  const details = entry.details ? JSON.parse(entry.details) : {};
  switch (entry.action) {
    case "creation":
      return "Demande créée";
    case "status_change":
      return `Statut : ${getStatutInfo(details.from).label} → ${getStatutInfo(details.to).label}`;
    case "message":
      return "Message ajouté";
    case "field_update":
      return "Champs modifiés";
    case "note_added":
      return "Note interne ajoutée";
    case "note_updated":
      return "Note interne modifiée";
    case "note_deleted":
      return "Note interne supprimée";
    default:
      return entry.action;
  }
}

export default function AdminDemandeDetailPage({ params }) {
  const [id, setId] = useState(null);
  const [demande, setDemande] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activity, setActivity] = useState([]);
  const [clients, setClients] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [clientMachines, setClientMachines] = useState([]);
  const [form, setForm] = useState({});
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  async function load() {
    if (!id) return;
    const [demRes, metaRes] = await Promise.all([
      fetch(`/api/demandes/${id}`),
      fetch("/api/demandes/meta"),
    ]);
    if (!demRes.ok) {
      setDemande(null);
      return;
    }
    const data = await demRes.json();
    const meta = metaRes.ok
      ? await metaRes.json()
      : { clients: [], admins: [] };
    setDemande(data.demande);
    setMessages(data.messages ?? []);
    setActivity(data.activity ?? []);
    setClients(meta.clients ?? []);
    setAdmins(meta.admins ?? []);
    setForm({
      titre: data.demande.titre,
      description: data.demande.description,
      type: data.demande.type,
      priorite: data.demande.priorite,
      status: data.demande.status,
      userId: data.demande.user_id,
      assignedTo: data.demande.assigned_to || "",
      machineId: data.demande.machine_id || "",
      notes_admin: data.demande.notes_admin || "",
    });
    if (data.demande.user_id) {
      const mRes = await fetch(`/api/clients/${data.demande.user_id}/machines`);
      const mData = mRes.ok ? await mRes.json() : { machines: [] };
      setClientMachines(mData.machines ?? []);
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/demandes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: form.titre,
          description: form.description,
          type: form.type,
          priorite: form.priorite,
          status: form.status,
          userId: form.userId,
          assignedTo: form.assignedTo || null,
          machineId: form.machineId || null,
          notes_admin: form.notes_admin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      await load();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMessage(e) {
    e.preventDefault();
    if (!contenu.trim()) return;
    const res = await fetch(`/api/demandes/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenu }),
    });
    if (res.ok) {
      setContenu("");
      await load();
    }
  }

  if (loading)
    return (
      <PageLayout title="Demande">
        <p className="page-muted">Chargement…</p>
      </PageLayout>
    );
  if (!demande)
    return (
      <PageLayout title="Introuvable">
        <p>Demande introuvable.</p>
      </PageLayout>
    );

  const statut = getStatutInfo(demande.status);
  const clientName =
    [demande.client_prenom, demande.client_nom].filter(Boolean).join(" ") ||
    demande.client_name ||
    "Client non renseigné";

  return (
    <PageLayout
      title={`Demande #${demande.id}`}
      description={
        <Link href={`/admin/clients/${demande.user_id}`} className="table-link">
          {clientName}
        </Link>
      }
    >
      <div className="detail-grid">
        <section className="page-card client-summary-card">
          <div>
            <p className="client-summary-label">Client</p>
            <h2>{clientName}</h2>
          </div>
          <dl className="client-summary-list">
            <div>
              <dt>Email</dt>
              <dd>{demande.client_email || "Non renseigné"}</dd>
            </div>
            <div>
              <dt>Téléphone</dt>
              <dd>{demande.client_phone || "Non renseigné"}</dd>
            </div>
            <div>
              <dt>Adresse</dt>
              <dd>{demande.client_adresse || "Non renseignée"}</dd>
            </div>
            {demande.client_notes_admin && (
              <div>
                <dt>Notes internes</dt>
                <dd className="client-summary-note">
                  {demande.client_notes_admin}
                </dd>
              </div>
            )}
          </dl>
          <Link
            href={`/admin/clients/${demande.user_id}`}
            className="btn btn-secondary"
          >
            Ouvrir la fiche client
          </Link>
        </section>

        <section className="page-card">
          <h2>Édition</h2>
          <form className="form-card form-card--inline" onSubmit={handleSave}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-field">
              <label>Titre</label>
              <input
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {DEMANDE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Priorité</label>
                <select
                  value={form.priorite}
                  onChange={(e) =>
                    setForm({ ...form, priorite: e.target.value })
                  }
                >
                  {DEMANDE_PRIORITES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Statut</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {Object.entries(DEMANDE_STATUTS).map(([v, i]) => (
                    <option key={v} value={v}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Assigné à</label>
                <select
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: e.target.value })
                  }
                >
                  <option value="">Non assignée</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {[a.prenom, a.nom].filter(Boolean).join(" ") || a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-field">
              <label>Machine</label>
              <select
                value={form.machineId}
                onChange={(e) =>
                  setForm({ ...form, machineId: e.target.value })
                }
              >
                <option value="">Non renseigné</option>
                {clientMachines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Notes internes admin</label>
              <textarea
                value={form.notes_admin}
                onChange={(e) =>
                  setForm({ ...form, notes_admin: e.target.value })
                }
                rows={4}
                placeholder="Observations internes, suivi technique, consignes… Invisible pour le client."
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>

          <div className="detail-meta" style={{ marginTop: "1rem" }}>
            <span className={`badge ${statut.badge}`}>{statut.label}</span>
            <span>{getTypeLabel(demande.type)}</span>
            <span>{getPrioriteLabel(demande.priorite)}</span>
          </div>
          <p className="page-muted">
            Créée le {formatDateTime(demande.created_at)}
          </p>
          {demande.last_activity_at && (
            <p className="page-muted">
              Dernière activité : {formatDateTime(demande.last_activity_at)}
            </p>
          )}
        </section>

        <section className="page-card customer-messages-card">
          <h2>Réponse au client</h2>
          <ul className="message-list">
            {messages.map((msg) => (
              <li
                key={msg.id}
                className={`message-item${msg.auteur_role === "admin" ? " message-item--admin" : ""}`}
              >
                <div className="message-header">
                  <strong>
                    {msg.auteur_prenom || msg.auteur_nom || msg.auteur_name}
                  </strong>
                  <span className="page-muted">
                    {formatDateTime(msg.created_at)}
                  </span>
                </div>
                <p>{msg.contenu}</p>
              </li>
            ))}
          </ul>
          {demande.status !== "fermee" && (
            <form className="message-form" onSubmit={handleMessage}>
              <textarea
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                rows={3}
                placeholder="Réponse au client…"
                required
              />
              <button type="submit" className="btn btn-primary">
                Répondre
              </button>
            </form>
          )}
        </section>

        <section className="page-card">
          <h2>Journal d&apos;activité</h2>
          <ul className="activity-list">
            {activity.map((entry) => (
              <li key={entry.id} className="activity-item">
                <span>{formatActivity(entry)}</span>
                <span className="page-muted">
                  {formatDateTime(entry.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageLayout>
  );
}
