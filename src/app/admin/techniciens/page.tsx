"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuPencil } from "react-icons/lu";
import PageLayout from "@/components/PageLayout";
import TechnicianCreateModal from "@/components/TechnicianCreateModal";
import TechnicianEditModal from "@/components/TechnicianEditModal";
import type {
  ListTechniciansResponse,
  TechnicienDisplay,
} from "@/types/technicien";

export default function AdminTechniciensPage() {
  const router = useRouter();
  const [techniciens, setTechnicians] = useState<TechnicienDisplay[]>([]);
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TechnicienDisplay | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setCreating(true);
      router.replace("/admin/techniciens", { scroll: false });
    }
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (includeArchived) params.set("archived", "1");

    fetch(`/api/techniciens?${params}`)
      .then((res) => (res.ok ? res.json() : { techniciens: [] }))
      .then((data: ListTechniciansResponse) =>
        setTechnicians(data.techniciens ?? []),
      )
      .finally(() => setLoading(false));
  }, [search, includeArchived]);

  const visibleTechniciens = techniciens.filter(
    (t) => includeArchived || !t.archived,
  );

  return (
    <PageLayout
      title="Techniciens"
      description="Gestion des comptes techniciens."
    >
      <div className="admin-demandes-header">
        <div className="filters-row">
          <div className="form-field search-field">
            <input
              type="search"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="filter-toggle">
            <span className="filter-toggle-label">Inclure archivés</span>
            <button
              type="button"
              role="switch"
              aria-checked={includeArchived}
              className={`filter-toggle-switch${includeArchived ? " filter-toggle-switch--on" : ""}`}
              onClick={() => setIncludeArchived((v) => !v)}
            >
              <span className="filter-toggle-knob" />
            </button>
          </label>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setCreating(true)}
        >
          Nouveau technicien
        </button>
      </div>

      {loading ? (
        <p className="page-muted">Chargement…</p>
      ) : visibleTechniciens.length === 0 ? (
        <div className="empty-state">
          <p>Aucun technicien trouvé.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th style={{ width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleTechniciens.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link
                      href={`/admin/techniciens/${t.id}`}
                      className="table-link"
                    >
                      {t.name}
                    </Link>
                  </td>
                  <td>{t.email}</td>
                  <td>{t.phone_number || "—"}</td>
                  <td>
                    {t.archived ? (
                      <span className="badge badge--muted">Archivé</span>
                    ) : t.mustChangePassword ? (
                      <span className="badge badge--warning">
                        MDP temporaire
                      </span>
                    ) : (
                      <span className="badge badge--success">Actif</span>
                    )}
                  </td>
                  <td>
                    {t.createdAt
                      ? new Date(t.createdAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn action-button-demande-table"
                      onClick={() => setEditing(t)}
                    >
                      <span>Gérer</span>
                      <LuPencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <TechnicianCreateModal
          onClose={() => setCreating(false)}
          onCreated={(technicien) => {
            setTechnicians((prev) => [technicien, ...prev]);
          }}
        />
      )}

      {editing && (
        <TechnicianEditModal
          technicien={editing}
          onClose={() => setEditing(null)}
          onUpdated={(updated) => {
            setTechnicians((prev) =>
              prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
            );
            setEditing((prev) => (prev ? { ...prev, ...updated } : prev));
          }}
        />
      )}
    </PageLayout>
  );
}
