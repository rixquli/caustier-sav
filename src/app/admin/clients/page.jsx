"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuPencil } from "react-icons/lu";
import PageLayout from "@/components/PageLayout";
import ClientCreateModal from "@/components/ClientCreateModal";
import ClientEditModal from "@/components/ClientEditModal";

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setCreating(true);
      router.replace("/admin/clients", { scroll: false });
    }
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (includeArchived) params.set("archived", "1");

    fetch(`/api/clients?${params}`)
      .then((res) => (res.ok ? res.json() : { clients: [] }))
      .then((data) => setClients(data.clients ?? []))
      .finally(() => setLoading(false));
  }, [search, includeArchived]);

  return (
    <PageLayout title="Clients" description="Gestion des comptes clients.">
      <div className="admin-demandes-header">
        <div className="filters-row">
          <div className="form-field search-field">
            <input type="search" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
          Nouveau client
        </button>
      </div>

      {loading ? (
        <p className="page-muted">Chargement…</p>
      ) : clients.length === 0 ? (
        <div className="empty-state"><p>Aucun client trouvé.</p></div>
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
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/clients/${c.id}`} className="table-link">
                      {[c.prenom, c.nom].filter(Boolean).join(" ") || c.displayName}
                    </Link>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.phone || "—"}</td>
                  <td>
                    {c.archived ? (
                      <span className="badge badge--muted">Archivé</span>
                    ) : c.mustChangePassword ? (
                      <span className="badge badge--warning">MDP temporaire</span>
                    ) : (
                      <span className="badge badge--success">Actif</span>
                    )}
                  </td>
                  <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn action-button-demande-table"
                      onClick={() => setEditing(c)}
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
        <ClientCreateModal
          onClose={() => setCreating(false)}
          onCreated={(client) => {
            setClients((prev) => [client, ...prev]);
          }}
        />
      )}

      {editing && (
        <ClientEditModal
          client={editing}
          onClose={() => setEditing(null)}
          onUpdated={(updated) => {
            setClients((prev) =>
              prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
            );
            setEditing((prev) => (prev ? { ...prev, ...updated } : prev));
          }}
        />
      )}
    </PageLayout>
  );
}
