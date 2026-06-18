"use client";

import { FiSearch } from "react-icons/fi";
import {
  DEMANDE_PRIORITES,
  DEMANDE_STATUTS,
  DEMANDE_TYPES,
} from "@/lib/constants";

export default function AdminDemandeFilters({
  filters,
  onChange,
  clients = [],
}) {
  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="filters-panel">
      <div className="filters-row">
        <div className="filter-search">
          <label>Recherche</label>
          <div>
            <FiSearch className="filter-search-icon" aria-hidden="true" />
            <input
              type="search"
              placeholder="Recherche"
              value={filters.search}
              onChange={(e) => set("search", e.target.value)}
            />
          </div>
        </div>

        <div className="filter-select-wrap">
          <label htmlFor="filter-statut">Statut</label>
          <select
            id="filter-statut"
            value={filters.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="">Tous</option>
            {Object.entries(DEMANDE_STATUTS).map(([value, info]) => (
              <option key={value} value={value}>
                {info.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-select-wrap">
          <label htmlFor="filter-type">Type</label>
          <select
            id="filter-type"
            value={filters.type}
            onChange={(e) => set("type", e.target.value)}
          >
            <option value="">Tous</option>
            {DEMANDE_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-select-wrap">
          <label htmlFor="filter-priorite">Priorité</label>
          <select
            id="filter-priorite"
            value={filters.priorite}
            onChange={(e) => set("priorite", e.target.value)}
          >
            <option value="">Toutes</option>
            {DEMANDE_PRIORITES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-select-wrap">
          <label htmlFor="filter-client">Client</label>
          <select
            id="filter-client"
            value={filters.clientId}
            onChange={(e) => set("clientId", e.target.value)}
          >
            <option value="">Tous</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {[c.prenom, c.nom].filter(Boolean).join(" ") || c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export function filterDemandes(demandes, filters) {
  const search = filters.search.trim().toLowerCase();

  return demandes.filter((demande) => {
    if (search) {
      const haystack = [
        demande.titre,
        demande.description,
        demande.client_nom,
        demande.client_prenom,
        demande.client_name,
        demande.machine_nom,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (filters.status && demande.status !== filters.status) return false;
    if (filters.type && demande.type !== filters.type) return false;
    if (filters.priorite && demande.priorite !== filters.priorite) return false;
    if (filters.clientId && demande.user_id !== filters.clientId) return false;
    return true;
  });
}
