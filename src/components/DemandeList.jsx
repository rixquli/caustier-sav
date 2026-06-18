"use client";

import Link from "next/link";
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
    month: "short",
    year: "numeric",
  });
}

export function DemandeCardList({
  demandes,
  detailBasePath = "/demandes",
  showClient = false,
  emptyMessage = "Aucune demande.",
}) {
  if (!demandes.length) {
    return <p className="page-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="demande-card-list">
      {demandes.map((demande) => {
        const statut = getStatutInfo(demande.status);
        return (
          <li key={demande.id} className="demande-card-item">
            <Link href={`${detailBasePath}/${demande.id}`} className="demande-card-link">
              <div className="demande-card-main">
                <span className="demande-card-id">#{demande.id}</span>
                <h3>{demande.titre}</h3>
                <p>
                  {showClient &&
                    `${[demande.client_prenom, demande.client_nom].filter(Boolean).join(" ") ||
                      demande.client_name ||
                      "Client non renseigné"} · `}
                  {demande.machine_nom || "Machine non renseignée"} · Dernière activité{" "}
                  {formatDate(demande.last_activity_at || demande.created_at)}
                </p>
              </div>
              <div className="demande-card-badges">
                <span className={`badge ${statut.badge}`}>{statut.label}</span>
                <span className={`badge badge-type ${getTypeBadge(demande.type)}`}>
                  {getTypeLabel(demande.type)}
                </span>
                <span className={`badge badge-prio ${getPrioriteBadge(demande.priorite)}`}>
                  {getPrioriteLabel(demande.priorite)}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
