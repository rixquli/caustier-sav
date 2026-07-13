"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiLock, FiTrash2 } from "react-icons/fi";
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
import type {
  ApiErrorResponse,
  DemandeActivityRow,
  DemandeDetailResponse,
  DemandeDisplay,
  DemandeMetaResponse,
  UpdateDemandeRequest,
} from "@/types/demande";
import type { TechnicienDisplay } from "@/types/technicien";

type PageProps = {
  params: Promise<{ id: string }>;
};

type TimelineEntry = {
  id: number;
  at: string;
  author: string;
  text: string;
};

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatActivity(entry: DemandeActivityRow): string {
  const details = entry.details
    ? (JSON.parse(entry.details) as Record<string, unknown>)
    : {};
  const technicianName = String(details.technicianName ?? "Technicien");
  const toTechnicianName = String(
    details.toTechnicianName ?? details.technicianName ?? "Technicien",
  );
  const fromTechnicianName = String(details.fromTechnicianName ?? "Technicien");
  const clientPhone = details.clientPhone ? String(details.clientPhone) : null;

  switch (entry.action) {
    case "creation":
      return "a créé la requête";
    case "status_change":
      return `a changé le statut : ${getStatutInfo(String(details.from)).label} → ${getStatutInfo(String(details.to)).label}`;
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
    case "whatsapp_technician_accepted":
      return clientPhone
        ? `${technicianName} a accepté via WhatsApp — contact client : ${clientPhone}`
        : `${technicianName} a accepté via WhatsApp`;
    case "whatsapp_technician_refused":
      return `${technicianName} a refusé via WhatsApp`;
    case "whatsapp_technician_reassigned":
      return `Réassignée à ${toTechnicianName} après refus de ${fromTechnicianName}`;
    case "whatsapp_message_sent":
      if (details.reassignedAfterRefusal) {
        return `Notification WhatsApp de réassignation envoyée à ${technicianName}`;
      }
      return `Notification WhatsApp envoyée à ${technicianName}`;
    case "whatsapp_message_failed":
      return `Échec envoi WhatsApp à ${technicianName}`;
    case "whatsapp_no_technician_available":
      return "Aucun technicien disponible";
    default:
      return entry.action;
  }
}

function personName(parts: (string | null | undefined)[], fallback?: string | null): string {
  return parts.filter(Boolean).join(" ") || fallback || "Système";
}

export default function AdminDemandeDetailPage({ params }: PageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [demande, setDemande] = useState<DemandeDisplay | null>(null);
  const [activity, setActivity] = useState<DemandeActivityRow[]>([]);
  const [clients, setClients] = useState<DemandeMetaResponse["clients"]>([]);
  const [admins, setAdmins] = useState<DemandeMetaResponse["admins"]>([]);
  const [technicians, setTechnicians] = useState<TechnicienDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
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
    const data = (await demRes.json()) as DemandeDetailResponse;
    const meta = metaRes.ok
      ? ((await metaRes.json()) as DemandeMetaResponse)
      : { clients: [], admins: [], technicians: [] };
    setDemande(data.demande);
    setActivity(data.activity ?? []);
    setClients(meta.clients ?? []);
    setAdmins(meta.admins ?? []);
    setTechnicians(
      (meta.technicians ?? []).map(
        (technician): TechnicienDisplay => ({
          id: Number(technician.id),
          name: technician.name ?? "",
          specialite: technician.specialite ?? "",
          email: technician.email ?? "",
          telephone: technician.telephone ?? "",
          phone_number: technician.telephone ?? "",
          createdAt: "",
          updatedAt: "",
          notes: null,
          notes_admin: null,
          displayName: technician.name ?? "",
        }),
      ),
    );
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  async function quickUpdate(changes: UpdateDemandeRequest) {
    setError("");
    const res = await fetch(`/api/demandes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
      setError(data.error || "Mise à jour impossible.");
      return;
    }
    await load();
  }

  async function handleCloseTicket() {
    if (!demande) return;
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
    if (!demande) return;
    if (
      !window.confirm(
        `Supprimer définitivement « ${demande.titre} » ? Cette action est irréversible.`,
      )
    ) {
      return;
    }
    const res = await fetch(`/api/demandes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
      setError(data.error || "Suppression impossible.");
      return;
    }
    router.push("/admin/demandes");
  }

  const timeline = useMemo(
    () =>
      activity
        .filter((a) => a.action !== "message")
        .map((a): TimelineEntry => ({
          id: a.id,
          at: a.created_at,
          author: personName([a.user_prenom, a.user_nom], a.user_name),
          text: formatActivity(a),
        }))
        .sort((x, y) => {
          const timeDiff =
            new Date(x.at).getTime() - new Date(y.at).getTime();
          return timeDiff !== 0 ? timeDiff : x.id - y.id;
        }),
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
  const isResolvedOrClosed =
    demande.status === "fermee" || demande.status === "resolue";

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

          <section className="page-card">
            <div className="detail-topbar">
              <h2>Suivi</h2>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => load()}
              >
                Actualiser
              </button>
            </div>
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
