"use client";

import { useEffect, useRef, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/context/AuthContext";
import { getPrioriteLabel, getStatutInfo, getTypeLabel } from "@/lib/constants";
import { getClientViewMessageLabel, isClientMessage } from "@/lib/messages";

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("fr-FR");
}

export default function DemandeDetailPage({ params }) {
  const { user } = useAuth();
  const [id, setId] = useState(null);
  const [demande, setDemande] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const chatThreadRef = useRef(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    const thread = chatThreadRef.current;
    if (!thread) return;
    requestAnimationFrame(() => {
      thread.scrollTop = thread.scrollHeight;
    });
  }, [messages]);

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

  function handleKeyDown(e) {
    if (e.key == "Enter" && !e.shiftKey) {
      handleSend(e);
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
      <div className="detail-layout demande-detail-client">
        <div className="detail-main">
          <section className="page-card customer-messages-card chat-panel">
            <h2>Messages</h2>
            <div className="chat-thread" ref={chatThreadRef}>
              {messages.length === 0 ? (
                <p className="page-muted chat-empty">
                  Aucun message pour le moment.
                </p>
              ) : (
                messages.map((msg) => {
                  const fromClient = isClientMessage(msg, demande.user_id);
                  return (
                    <div
                      key={msg.id}
                      className={`chat-row${fromClient ? " chat-row--mine" : " chat-row--theirs"}`}
                    >
                      <div className="chat-bubble-stack">
                        {!fromClient && (
                          <span className="chat-bubble-author">
                            {getClientViewMessageLabel(msg, demande, user)}
                          </span>
                        )}
                        <div className="chat-bubble">{msg.contenu}</div>
                        <time
                          className="chat-bubble-time"
                          dateTime={msg.created_at}
                        >
                          {formatDateTime(msg.created_at)}
                        </time>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {!isClosed && (
              <form className="chat-composer" onSubmit={handleSend}>
                {error && <div className="alert alert-error">{error}</div>}
                <textarea
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e)}
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
        </div>

        <aside className="detail-side">
          <section className="page-card demande-detail-info">
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
        </aside>
      </div>
    </PageLayout>
  );
}
