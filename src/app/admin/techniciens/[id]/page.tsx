"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { LuPencil } from "react-icons/lu";
import { getStatutInfo, getTypeBadge, getTypeLabel } from "@/lib/constants";
import TechnicianEditModal from "@/components/TechnicianEditModal";
import type {
  TechnicienDetailResponse,
  TechnicienDisplay,
} from "@/types/technicien";
import type { DemandeDisplay } from "@/types/demande";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export default function AdminTechnicianPage({ params }: PageProps) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [technician, setTechnician] = useState<TechnicienDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTechnician, setEditingTechnician] = useState(false);
  const [demandes, setDemandes] = useState<DemandeDisplay[]>([]);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  async function load() {
    if (!id) return;
    const [technicianRes, demandesRes] = await Promise.all([
      fetch(`/api/techniciens/${id}`),
      fetch("/api/demandes"),
    ]);
    if (!technicianRes.ok) {
      setTechnician(null);
      return;
    }
    const data = (await technicianRes.json()) as TechnicienDetailResponse;
    setTechnician(data.technicien);

    const demandesData = demandesRes.ok
      ? ((await demandesRes.json()) as { demandes?: DemandeDisplay[] })
      : { demandes: [] };
    setDemandes(
      (demandesData.demandes ?? []).filter((d) => d.assigned_to == id),
    );
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <p className="page-muted">Chargement…</p>
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="page">
        <Link href="/admin/techniciens" className="back-link">
          <FiArrowLeft aria-hidden="true" /> Retour
        </Link>
        <div className="empty-state">
          <p>Technicien introuvable.</p>
        </div>
      </div>
    );
  }

  const technicianName = technician.name;

  return (
    <div className="page">
      <Link href="/admin/techniciens" className="back-link">
        <FiArrowLeft aria-hidden="true" /> Retour
      </Link>

      <div className="detail-topbar">
        <div className="detail-title-meta">
          <h1>{technicianName}</h1>
          <span className="badge badge--muted">
            {demandes.length} demande{demandes.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="detail-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setEditingTechnician(true)}
          >
            <LuPencil size={15} /> Modifier
          </button>
        </div>
      </div>

      <div className="detail-layout detail-layout--aside-left">
        <aside className="detail-side">
          <section className="side-card">
            <h3>Technicien</h3>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-row-label">Email</span>
                <span className="info-row-value">
                  {technician.email || "—"}
                </span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Téléphone</span>
                <span className="info-row-value">
                  {technician.phone_number || technician.telephone || "—"}
                </span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Spécialité</span>
                <span className="info-row-value">
                  {technician.specialite || "—"}
                </span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Statut</span>
                <span className="info-row-value">
                  {technician.archived ? "Archivé" : "Actif"}
                </span>
              </div>
            </div>
            {technician.notes_admin && (
              <>
                <h3 style={{ marginTop: "1.25rem" }}>Notes internes</h3>
                <p className="technician-summary-note">
                  {technician.notes_admin}
                </p>
              </>
            )}
          </section>
        </aside>

        <div className="detail-main">
          <section className="page-card">
            <h2 style={{ marginBottom: "0.5rem" }}>
              Requêtes de ce technicien
            </h2>
            {demandes.length === 0 ? (
              <p className="page-muted">Aucune requête pour ce technicien.</p>
            ) : (
              <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Type</th>
                      <th>Statut</th>
                      <th>Créée le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandes.map((d) => {
                      const statut = getStatutInfo(d.status);
                      return (
                        <tr key={d.id}>
                          <td>
                            <Link
                              href={`/admin/demandes/${d.id}`}
                              className="table-link"
                            >
                              {d.titre}
                            </Link>
                          </td>
                          <td>
                            <span
                              className={`badge badge-type ${getTypeBadge(d.type)}`}
                            >
                              {getTypeLabel(d.type)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${statut.badge}`}>
                              {statut.label}
                            </span>
                          </td>
                          <td>{formatDate(d.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {editingTechnician && (
        <TechnicianEditModal
          technicien={technician}
          onClose={() => setEditingTechnician(false)}
          onUpdated={(updated) => {
            setTechnician((prev) => (prev ? { ...prev, ...updated } : prev));
          }}
          onDeleted={() => {
            router.push("/admin/techniciens");
          }}
        />
      )}
    </div>
  );
}
