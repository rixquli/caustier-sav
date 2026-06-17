"use client";

import Link from "next/link";
import { FiChevronDown } from "react-icons/fi";
import {
  getPrioriteBadge,
  getPrioriteLabel,
  getStatutInfo,
  getTypeBadge,
  getTypeLabel,
} from "@/lib/constants";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatAssignee(demande) {
  const name = [demande.assignee_prenom, demande.assignee_nom].filter(Boolean).join(" ")
    || demande.assignee_name;
  if (!name) return "—";
  const parts = name.split(/\s+/);
  return parts.length === 1 ? parts[0] : `${parts[0].charAt(0)}. ${parts.slice(1).join(" ")}`;
}

export default function AdminDemandeTable({ demandes, sortDesc, onToggleSort }) {
  if (!demandes.length) {
    return <div className="empty-state"><p>Aucune requête ne correspond aux filtres.</p></div>;
  }

  return (
    <div className="table-wrap admin-table-wrap">
      <table className="data-table admin-demandes-table">
        <thead>
          <tr>
            <th>Titre</th>
            <th>Client</th>
            <th>Type</th>
            <th>Priorité</th>
            <th>Statut</th>
            <th>Assigné à</th>
            <th>
              <button type="button" className="table-sort-btn" onClick={onToggleSort}>
                Créée le
                <FiChevronDown className={`table-sort-icon${sortDesc ? "" : " table-sort-icon--asc"}`} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {demandes.map((demande) => {
            const statut = getStatutInfo(demande.status);
            return (
              <tr key={demande.id}>
                <td>
                  <Link href={`/admin/demandes/${demande.id}`} className="table-link admin-title-link">
                    {demande.titre}
                  </Link>
                </td>
                <td>
                  {[demande.client_prenom, demande.client_nom].filter(Boolean).join(" ") || demande.client_name}
                </td>
                <td>
                  <span className={`badge badge-type ${getTypeBadge(demande.type)}`}>
                    {getTypeLabel(demande.type)}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-prio ${getPrioriteBadge(demande.priorite)}`}>
                    {getPrioriteLabel(demande.priorite)}
                  </span>
                </td>
                <td><span className={`badge ${statut.badge}`}>{statut.label}</span></td>
                <td>{formatAssignee(demande)}</td>
                <td>{formatDate(demande.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
