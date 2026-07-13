"use client";

import Link from "next/link";
import { useState } from "react";
import { FiChevronDown, FiLock, FiTrash2 } from "react-icons/fi";
import { LuPencil } from "react-icons/lu";
import {
  getPrioriteBadge,
  getPrioriteLabel,
  getStatutInfo,
  getTypeBadge,
  getTypeLabel,
} from "@/lib/constants";
import type {
  AdminDemandeTableProps,
  ApiErrorResponse,
  DemandeDisplay,
  UpdateDemandeRequest,
  UpdateDemandeResponse,
} from "@/types/demande";
import { EditDemandeModal } from "./EditDemandeModal";
import { CloseDemandeModal } from "./CloseDemandeModal";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatAssignee(demande: DemandeDisplay) {
  const name = demande.assignee_name;
  if (!name) return "—";
  const parts = name.split(/\s+/);
  return parts.length === 1
    ? parts[0]
    : `${parts[0].charAt(0)}. ${parts.slice(1).join(" ")}`;
}

function formatClient(demande: DemandeDisplay) {
  return (
    [demande.client_prenom, demande.client_nom].filter(Boolean).join(" ") ||
    demande.client_name ||
    "—"
  );
}

type DemandeQuickActionsProps = {
  demande: DemandeDisplay;
  currentUserId?: string;
  busy: boolean;
  onTakeCharge: (demande: DemandeDisplay) => void;
  onClose: (demande: DemandeDisplay) => void;
  onDelete: (demande: DemandeDisplay) => void;
  onEdit: (demande: DemandeDisplay) => void;
  compact?: boolean;
};

function DemandeQuickActions({
  demande,
  busy,
  onClose,
  onDelete,
  onEdit,
  compact = false,
}: DemandeQuickActionsProps) {
  const isClosed = demande.status === "fermee" || demande.status === "resolue";

  return (
    <div
      className={`demande-quick-actions${compact ? " demande-quick-actions--compact" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      {!isClosed && (
        <button
          type="button"
          className="demande-quick-action-btn demande-quick-action-btn--warning"
          title="Fermer le ticket"
          aria-label="Fermer le ticket"
          disabled={busy}
          onClick={() => onClose(demande)}
        >
          <FiLock aria-hidden="true" />
          {!compact && <span>Fermer</span>}
        </button>
      )}
      <button
        type="button"
        className="demande-quick-action-btn demande-quick-action-btn--danger"
        title="Supprimer le ticket"
        aria-label="Supprimer le ticket"
        disabled={busy}
        onClick={() => onDelete(demande)}
      >
        <FiTrash2 aria-hidden="true" />
        {!compact && <span>Suppr.</span>}
      </button>
      <button
        type="button"
        className="demande-quick-action-btn"
        title="Modifier"
        aria-label="Modifier la demande"
        disabled={busy}
        onClick={() => onEdit(demande)}
      >
        <LuPencil size={15} aria-hidden="true" />
        {!compact && <span>Gérer</span>}
      </button>
    </div>
  );
}

export default function AdminDemandeTable({
  demandes,
  clients = [],
  admins = [],
  technicians = [],
  currentUserId,
  sortDesc,
  onToggleSort,
  onUpdated,
  onDeleted,
}: AdminDemandeTableProps) {
  const [editingDemande, setEditingDemande] = useState<DemandeDisplay | null>(
    null,
  );
  const [busyId, setBusyId] = useState<number | null>(null);
  const [closedDemande, setClosedDemande] = useState<DemandeDisplay | null>(
    null,
  );

  async function patchDemande(
    demande: DemandeDisplay,
    changes: UpdateDemandeRequest,
  ) {
    setBusyId(demande.id);
    try {
      const res = await fetch(`/api/demandes/${demande.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        window.alert(data.error || "Mise à jour impossible.");
        return;
      }
      const data = (await res.json()) as UpdateDemandeResponse;
      onUpdated?.(data.demande);
    } finally {
      setBusyId(null);
    }
  }

  async function handleTakeCharge(demande: DemandeDisplay) {
    const changes: UpdateDemandeRequest = { assignedTo: currentUserId };
    if (demande.status === "nouvelle") {
      changes.status = "en_cours";
    }
    await patchDemande(demande, changes);
  }

  async function handleClose(demande: DemandeDisplay) {
    // if (
    //   !window.confirm(
    //     `Fermer la demande « ${demande.titre} » ? Le client ne pourra plus y répondre.`,
    //   )
    // ) {
    //   return;
    // }
    await patchDemande(demande, { status: "fermee" });
    setClosedDemande(demande);
  }

  async function handleDelete(demande: DemandeDisplay) {
    if (
      !window.confirm(
        `Supprimer définitivement « ${demande.titre} » ? Cette action est irréversible.`,
      )
    ) {
      return;
    }
    setBusyId(demande.id);
    try {
      const res = await fetch(`/api/demandes/${demande.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        window.alert(data.error || "Suppression impossible.");
        return;
      }
      onDeleted?.(demande.id);
    } finally {
      setBusyId(null);
    }
  }

  if (!demandes.length) {
    return (
      <div className="empty-state">
        <p>Aucune requête ne correspond aux filtres.</p>
      </div>
    );
  }

  const actionProps = {
    currentUserId,
    onTakeCharge: handleTakeCharge,
    onClose: (demande: DemandeDisplay) => setClosedDemande(demande),
    onDelete: handleDelete,
    onEdit: setEditingDemande,
  };

  return (
    <>
      <EditDemandeModal
        demande={editingDemande}
        clients={clients}
        admins={admins}
        technicians={technicians}
        onClose={() => setEditingDemande(null)}
        onUpdated={(updated) => {
          onUpdated?.(updated);
          setEditingDemande(null);
        }}
      />

      <CloseDemandeModal
        demande={closedDemande}
        onClose={() => setClosedDemande(null)}
        onUpdated={(updated) => {
          onUpdated?.(updated);
          setClosedDemande(null);
        }}
      />

      <div className="table-wrap admin-table-wrap admin-table-wrap--desktop">
        <table className="data-table admin-demandes-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Client</th>
              <th>Type</th>
              <th>Priorité</th>
              <th>Statut</th>
              <th className="col-hide-sm">Assigné à</th>
              <th>
                <button
                  type="button"
                  className="table-sort-btn"
                  onClick={onToggleSort}
                >
                  Créée le
                  <FiChevronDown
                    className={`table-sort-icon${sortDesc ? "" : " table-sort-icon--asc"}`}
                  />
                </button>
              </th>
              <th className="admin-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((demande) => {
              const statut = getStatutInfo(demande.status);
              const busy = busyId === demande.id;
              return (
                <tr key={demande.id}>
                  <td>
                    <Link
                      href={`/admin/demandes/${demande.id}`}
                      className="table-link admin-title-link"
                    >
                      {demande.titre}
                    </Link>
                  </td>
                  <td>{formatClient(demande)}</td>
                  <td>
                    <span
                      className={`badge badge-type ${getTypeBadge(demande.type)}`}
                    >
                      {getTypeLabel(demande.type)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge badge-prio ${getPrioriteBadge(demande.priorite)}`}
                    >
                      {getPrioriteLabel(demande.priorite)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${statut.badge}`}>
                      {statut.label}
                    </span>
                  </td>
                  <td className="col-hide-sm">{formatAssignee(demande)}</td>
                  <td>{formatDate(demande.created_at)}</td>
                  <td className="admin-col-actions">
                    <DemandeQuickActions
                      {...actionProps}
                      demande={demande}
                      busy={busy}
                      compact
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="admin-demande-cards">
        {demandes.map((demande) => {
          const statut = getStatutInfo(demande.status);
          const busy = busyId === demande.id;
          return (
            <li key={demande.id} className="admin-demande-card">
              <div className="admin-demande-card-head">
                <Link
                  href={`/admin/demandes/${demande.id}`}
                  className="admin-demande-card-title"
                >
                  {demande.titre}
                </Link>
                <span className={`badge ${statut.badge}`}>{statut.label}</span>
              </div>
              <p className="admin-demande-card-meta">
                {formatClient(demande)} · {formatDate(demande.created_at)}
                {demande.assigned_to
                  ? ` · ${formatAssignee(demande)}`
                  : " · Non assignée"}
              </p>
              <div className="admin-demande-card-badges">
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
              </div>
              <DemandeQuickActions
                {...actionProps}
                demande={demande}
                busy={busy}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}
