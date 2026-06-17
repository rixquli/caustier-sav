"use client";

import Link from "next/link";
import {
  getPrioriteLabel,
  getStatutInfo,
  getTypeLabel,
} from "@/lib/constants";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DemandeList({
  demandes,
  detailBasePath = "/demandes",
  showClient = false,
}) {
  if (!demandes.length) {
    return (
      <div className="empty-state">
        <p>Aucune demande pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Titre</th>
            {showClient && <th>Client</th>}
            <th>Type</th>
            <th>Priorité</th>
            <th>Machine</th>
            <th>Statut</th>
            <th>Créée le</th>
          </tr>
        </thead>
        <tbody>
          {demandes.map((demande) => {
            const statut = getStatutInfo(demande.status);
            return (
              <tr key={demande.id}>
                <td>
                  <Link href={`${detailBasePath}/${demande.id}`} className="table-link">
                    #{demande.id}
                  </Link>
                </td>
                <td>
                  <Link href={`${detailBasePath}/${demande.id}`} className="table-link">
                    {demande.titre}
                  </Link>
                </td>
                {showClient && (
                  <td>
                    {[demande.client_prenom, demande.client_nom].filter(Boolean).join(" ") ||
                      demande.client_name}
                  </td>
                )}
                <td>{getTypeLabel(demande.type)}</td>
                <td>{getPrioriteLabel(demande.priorite)}</td>
                <td>{demande.machine_nom || "Non renseigné"}</td>
                <td>
                  <span className={`badge ${statut.badge}`}>{statut.label}</span>
                </td>
                <td>{formatDate(demande.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DemandeCardList({ demandes, detailBasePath = "/demandes" }) {
  if (!demandes.length) {
    return <p className="page-muted">Aucune demande.</p>;
  }

  return (
    <ul className="dashboard-list">
      {demandes.map((demande) => {
        const statut = getStatutInfo(demande.status);
        return (
          <li key={demande.id}>
            <Link href={`${detailBasePath}/${demande.id}`} className="table-link">
              #{demande.id} — {demande.titre}
            </Link>
            <span className={`badge ${statut.badge}`}>{statut.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
