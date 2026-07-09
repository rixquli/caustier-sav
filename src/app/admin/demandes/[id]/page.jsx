"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiLock, FiTrash2, FiUserCheck } from "react-icons/fi";
import { LuPencil } from "react-icons/lu";
import { EditDemandeModal } from "@/components/EditDemandeModal";
import { useAuth } from "@/context/AuthContext";
import {
  DEMANDE_STATUTS,
  getPrioriteBadge,
  getPrioriteLabel,
  getStatutInfo,
  getTypeBadge,
  getTypeLabel,
} from "@/lib/constants";
import {
  getAdminViewMessageLabel,
  isAdminOwnMessage,
  isClientMessage,
} from "@/lib/messages";

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatActivity(entry) {
  const details = entry.details ? JSON.parse(entry.details) : {};
  switch (entry.action) {
    case "creation":
      return "a créé la requête";
    case "status_change":
      return `a changé le statut : ${getStatutInfo(details.from).label} → ${getStatutInfo(details.to).label}`;
    case "message":
      return "a ajouté un message";
    case "field_update":
      return "a modifié la requête";
    case "note_added":
      return "a ajouté une note interne";
    case "note_updated":
      return "a modifié une note interne";
    case "note_deleted":
      return "a supprimé une note interne";
    default:
      return entry.action;
  }
}

function personName(parts, fallback) {
  return parts.filter(Boolean).join(" ") || fallback || "Système";
}

export default function AdminDemandeDetailPage({ params }) {
  const { user } = useAuth();
  const router = useRouter();
  const [id, setId] = useState(null);
  const [demande, setDemande] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activity, setActivity] = useState([]);
  const [clients, setClients] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [contenu, setContenu] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
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
      : { clients: [], admins: [], technicians: [] };
    setDemande(data.demande);
    setMessages(data.messages ?? []);
    setActivity(data.activity ?? []);
    setClients(meta.clients ?? []);
    setAdmins(meta.admins ?? []);
    setTechnicians(meta.technicians ?? []);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  async function quickUpdate(changes) {
    setError("");
    const res = await fetch(`/api/demandes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Mise à jour impossible.");
      return;
    }
    await load();
  }

  async function handleTakeCharge() {
    const changes = { assignedTo: user.id };
    if (demande.status === "nouvelle") {
      changes.status = "en_cours";
    }
    await quickUpdate(changes);
  }

  async function handleCloseTicket() {
    if (
      !window.confirm(
        `Fermer la demande « ${demande.titre} » ? Le client ne pourra plus y répondre.`,
      )
    ) {
      return;
    }
    await quickUpdate({ status: "fermee" });
  }

  async function handleDeleteTicket() {
    if (
      !window.confirm(
        `Supprimer définitivement « ${demande.titre} » ? Cette action est irréversible.`,
      )
    ) {
      return;
    }
    const res = await fetch(`/api/demandes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Suppression impossible.");
      return;
    }
    router.push("/admin/demandes");
  }

  async function handleMessage(e) {
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
      if (res.ok) {
        setContenu("");
        await load();
      } else {
        setError("Envoi impossible.");
      }
    } finally {
      setSending(false);
    }
  }

  const timeline = useMemo(
    () =>
      activity
        .filter((a) => a.action !== "message")
        .map((a) => ({
          id: a.id,
          at: a.created_at,
          author: personName([a.user_prenom, a.user_nom], a.user_name),
          text: formatActivity(a),
        }))
        .sort((x, y) => new Date(x.at) - new Date(y.at)),
    [activity],
  );

  if (loading) {
    return (
      <div className="page">
        <p className="page-muted">Chargement…</p>
      </div>
    );
  }

  if (!demande) {
    return (
      <div className="page">
        <Link href="/admin/demandes" className="back-link">
          <FiArrowLeft aria-hidden="true" /> Retour
        </Link>
        <div className="empty-state">
          <p>Demande introuvable.</p>
        </div>
      </div>
    );
  }

  const statut = getStatutInfo(demande.status);
  const clientName =
    [demande.client_prenom, demande.client_nom].filter(Boolean).join(" ") ||
    demande.client_name ||
    "Client non renseigné";
  const isClosed = demande.status === "fermee";
  const isResolvedOrClosed =
    demande.status === "fermee" || demande.status === "resolue";
  const isMine = user?.id && String(demande.assigned_to) === String(user.id);
  const canTakeCharge =
    !isResolvedOrClosed && (!isMine || demande.status === "nouvelle");

  return (
    <div className="page">
      <Link href="/admin/demandes" className="back-link">
        <FiArrowLeft aria-hidden="true" /> Retour
      </Link>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-layout">
        <div className="detail-main">
          <section className="page-card">
            <div className="detail-topbar">
              <div>
                <h1>{demande.titre}</h1>
                <div className="detail-badges">
                  <span
                    className={`badge badge-type ${getTypeBadge(demande.type)}`}
                  >
                    {getTypeLabel(demande.type)}
                  </span>
                  <span
                    className={`badge badge-prio ${getPrioriteBadge(demande.priorite)}`}
                  >
                    {getPrioriteLabel(demande.priorite)}
                  </span>
                  <span className={`badge ${statut.badge}`}>
                    {statut.label}
                  </span>
                </div>
                {demande.description && (
                  <p className="detail-path">{demande.description}</p>
                )}
                <p className="detail-meta-line">
                  Créée le {formatDateTime(demande.created_at)}
                  {demande.machine_nom ? ` · ${demande.machine_nom}` : ""}
                </p>
              </div>
              <div className="detail-actions">
                <div className="demande-quick-actions detail-demande-quick-actions">
                  {/* {canTakeCharge && (
                    <button
                      type="button"
                      className="demande-quick-action-btn demande-quick-action-btn--primary"
                      onClick={handleTakeCharge}
                    >
                      <FiUserCheck aria-hidden="true" />
                      <span>Prendre en charge</span>
                    </button>
                  )} */}
                  {!isResolvedOrClosed && (
                    <button
                      type="button"
                      className="demande-quick-action-btn demande-quick-action-btn--warning"
                      onClick={handleCloseTicket}
                    >
                      <FiLock aria-hidden="true" />
                      <span>Fermer</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="demande-quick-action-btn demande-quick-action-btn--danger"
                    onClick={handleDeleteTicket}
                  >
                    <FiTrash2 aria-hidden="true" />
                    <span>Supprimer</span>
                  </button>
                </div>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setEditing(true)}
                >
                  <LuPencil size={15} /> Modifier
                </button>
              </div>
            </div>
          </section>

          {/* <section className="page-card customer-messages-card chat-panel">
            <h2>Messages</h2>
            <div className="chat-thread" ref={chatThreadRef}>
              {messages.length === 0 ? (
                <p className="page-muted chat-empty">
                  Aucun message pour le moment.
                </p>
              ) : (
                messages.map((msg) => {
                  const fromAdmin = !isClientMessage(msg, demande.user_id);
                  const isOwn = isAdminOwnMessage(msg, user);
                  const showAuthor = !isOwn;
                  return (
                    <div
                      key={msg.id}
                      className={`chat-row${fromAdmin && isOwn ? " chat-row--mine" : " chat-row--theirs"}`}
                    >
                      <div className="chat-bubble-stack">
                        {showAuthor && (
                          <span className="chat-bubble-author">
                            {getAdminViewMessageLabel(msg, demande, user)}
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
              <form className="chat-composer" onSubmit={handleMessage}>
                <textarea
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  rows={3}
                  placeholder="Répondre au client…"
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
          </section> */}

          <section className="page-card">
            <h2>Suivi</h2>
            {timeline.length === 0 ? (
              <p className="page-muted">Aucune activité pour le moment.</p>
            ) : (
              <ul className="timeline">
                {timeline.map((ev) => (
                  <li key={ev.id} className="timeline-item">
                    <div className="timeline-marker">
                      <span className="timeline-dot timeline-dot--muted" />
                      <span className="timeline-line" />
                    </div>
                    <div className="timeline-body">
                      <div className="timeline-head">
                        <span className="timeline-author">{ev.author}</span>
                        <span className="timeline-date">
                          {formatDateTime(ev.at)}
                        </span>
                      </div>
                      <p className="timeline-text">{ev.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="detail-side">
          <section className="side-card">
            <h3>Statut</h3>
            <div className="form-field">
              <select
                value={demande.status}
                onChange={(e) => quickUpdate({ status: e.target.value })}
              >
                {Object.entries(DEMANDE_STATUTS).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="side-card">
            <h3>Assigné à</h3>
            <div className="form-field">
              <select
                value={demande.assigned_to || ""}
                onChange={(e) =>
                  quickUpdate({ assignedTo: e.target.value || null })
                }
              >
                <option value="">Non assignée</option>
                {technicians.map((a) => (
                  <option key={a.id} value={a.id}>
                    {[a.name, a.specialite].filter(Boolean).join(" ") || a.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="side-card">
            <h3>Client</h3>
            <p style={{ fontWeight: 700, marginBottom: "0.6rem" }}>
              {clientName}
            </p>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-row-label">Email</span>
                <span className="info-row-value">
                  {demande.client_email || "—"}
                </span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Téléphone</span>
                <span className="info-row-value">
                  {demande.client_phone || "—"}
                </span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Adresse</span>
                <span className="info-row-value">
                  {demande.client_adresse || "—"}
                </span>
              </div>
            </div>
            {demande.user_id && (
              <Link
                href={`/admin/clients/${demande.user_id}`}
                className="btn btn-secondary"
                style={{ marginTop: "1rem", width: "100%" }}
              >
                Voir la fiche client
              </Link>
            )}
          </section>
        </aside>
      </div>

      {editing && (
        <EditDemandeModal
          demande={demande}
          clients={clients}
          admins={admins}
          technicians={technicians}
          onClose={() => setEditing(false)}
          onUpdated={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </div>
  );
}
