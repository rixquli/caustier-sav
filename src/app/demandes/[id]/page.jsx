"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { getPrioriteLabel, getStatutInfo, getTypeLabel } from "@/lib/constants";

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
      return "Nouveau message";
    case "field_update":
      return "Demande mise à jour";
    default:
      return entry.action;
  }
}

export default function DemandeDetailPage({ params }) {
  const [id, setId] = useState(null);
  const [demande, setDemande] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activity, setActivity] = useState([]);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  async function load() {
    if (!id) return;
    const res = await fetch(`/api/demandes/${id}`);
    if (!res.ok) {
      setDemande(null);
      return;
    }
    const data = await res.json();
    setDemande(data.demande);
    setMessages(data.messages ?? []);
    setActivity(data.activity ?? []);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  async function handleSend(e) {
    e.preventDefault();
    if (!contenu.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/demandes/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setContenu("");
      await load();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSending(false);
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
  const isClosed = demande.status === "fermee";

  return (
    <PageLayout title={`Demande #${demande.id}`} description={demande.titre}>
      <div className="detail-grid">
        <section className="page-card">
          <div className="detail-meta">
            <span className={`badge ${statut.badge}`}>{statut.label}</span>
            <span>{getTypeLabel(demande.type)}</span>
            <span>{getPrioriteLabel(demande.priorite)}</span>
            <span>{demande.machine_nom || "Non renseigné"}</span>
          </div>
          <p className="detail-description">{demande.description}</p>
          <p className="page-muted">
            Créée le {formatDateTime(demande.created_at)}
          </p>
          {demande.last_activity_at && (
            <p className="page-muted">
              Dernière activité : {formatDateTime(demande.last_activity_at)}
            </p>
          )}
          {demande.resolved_at && (
            <p className="page-muted">
              Résolue le {formatDateTime(demande.resolved_at)}
            </p>
          )}
          {demande.closed_at && (
            <p className="page-muted">
              Fermée le {formatDateTime(demande.closed_at)}
            </p>
          )}
        </section>

        <section className="page-card">
          <h2>Messages</h2>
          {messages.length === 0 ? (
            <p className="page-muted">Aucun message.</p>
          ) : (
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
          )}
          {!isClosed && (
            <form className="message-form" onSubmit={handleSend}>
              {error && <div className="alert alert-error">{error}</div>}
              <textarea
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                rows={3}
                placeholder="Votre message…"
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending}
              >
                {sending ? "Envoi…" : "Envoyer"}
              </button>
            </form>
          )}
        </section>

        <section className="page-card">
          <h2>Journal d&apos;activité</h2>
          {activity.length === 0 ? (
            <p className="page-muted">Aucune activité.</p>
          ) : (
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
          )}
        </section>
      </div>
    </PageLayout>
  );
}
