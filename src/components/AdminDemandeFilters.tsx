"use client";

import { FiSearch } from "react-icons/fi";
import {
  ACTIVE_STATUSES,
  DEMANDE_STATUTS,
  DEMANDE_TYPES,
} from "@/lib/constants";
import type {
  AdminDemandeFiltersProps,
  DemandeDisplay,
  DemandeFiltersState,
} from "@/types/demande";

const DAY_MS = 1000 * 60 * 60 * 24;
const LATE_THRESHOLD_DAYS = 14;

type ToggleProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="filter-toggle">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`filter-toggle-switch${checked ? " filter-toggle-switch--on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="filter-toggle-knob" />
      </button>
      <span className="filter-toggle-label">{label}</span>
    </label>
  );
}

export default function AdminDemandeFilters({
  filters,
  onChange,
}: AdminDemandeFiltersProps) {
  function set<K extends keyof DemandeFiltersState>(
    key: K,
    value: DemandeFiltersState[K],
  ) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="filters-panel">
      <div className="filters-row">
        <div className="filter-search">
          <label htmlFor="filter-search-input">Recherche</label>
          <FiSearch className="filter-search-icon" aria-hidden="true" />
          <input
            id="filter-search-input"
            type="search"
            placeholder="Titre, client, machine…"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
          />
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

        <div className="filter-toggles-wrap">
          <span className="filter-label-spacer" aria-hidden="true" />
          <div className="filters-toggles">
            <Toggle
              label="Ouvertes seulement"
              checked={filters.openOnly}
              onChange={(v) => set("openOnly", v)}
            />
            <Toggle
              label="Mes requêtes"
              checked={filters.mine}
              onChange={(v) => set("mine", v)}
            />
            <Toggle
              label="Non assignées"
              checked={filters.unassigned}
              onChange={(v) => set("unassigned", v)}
            />
            <Toggle
              label="En retard"
              checked={filters.late}
              onChange={(v) => set("late", v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function filterDemandes(
  demandes: DemandeDisplay[],
  filters: DemandeFiltersState,
  currentUserId?: string,
): DemandeDisplay[] {
  const search = filters.search.trim().toLowerCase();
  const now = Date.now();

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

    const isActive = ACTIVE_STATUSES.includes(demande.status);

    if (filters.openOnly && !isActive) return false;
    if (filters.mine && demande.assigned_to !== currentUserId) return false;
    if (filters.unassigned && demande.assigned_to) return false;
    if (filters.late) {
      const ageDays =
        (now - new Date(demande.created_at).getTime()) / DAY_MS;
      if (!isActive || ageDays <= LATE_THRESHOLD_DAYS) return false;
    }

    return true;
  });
}
