"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import AdminCreateDemandeModal from "@/components/AdminCreateDemandeModal";
import AdminDemandeFilters, {
  filterDemandes,
} from "@/components/AdminDemandeFilters";
import AdminDemandeTable from "@/components/AdminDemandeTable";
import type {
  DemandeAdminOption,
  DemandeClientOption,
  DemandeDisplay,
  DemandeFiltersState,
  DemandeMetaResponse,
  ListDemandesResponse,
} from "@/types/demande";
import type { TechnicienDisplay } from "@/types/technicien";

const DEFAULT_FILTERS: DemandeFiltersState = {
  search: "",
  status: "",
  type: "",
  openOnly: true,
  mine: false,
  unassigned: false,
  late: false,
};

export default function AdminDemandesPage() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState<DemandeDisplay[]>([]);
  const [clients, setClients] = useState<DemandeClientOption[]>([]);
  const [admins, setAdmins] = useState<DemandeAdminOption[]>([]);
  const [technicians, setTechnicians] = useState<TechnicienDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<DemandeFiltersState>(DEFAULT_FILTERS);
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const next: Partial<DemandeFiltersState> = {};
    if (p.has("q")) {
      next.search = p.get("q") ?? "";
      next.openOnly = false;
    }
    if (p.has("status")) next.status = p.get("status") ?? "";
    if (p.has("type")) next.type = p.get("type") ?? "";
    if (p.has("unassigned")) next.unassigned = p.get("unassigned") === "1";
    if (p.has("late")) next.late = p.get("late") === "1";
    if (p.has("mine")) next.mine = p.get("mine") === "1";
    if (p.has("open")) next.openOnly = p.get("open") === "1";
    if (Object.keys(next).length) {
      setFilters((prev) => ({ ...prev, ...next }));
    }
  }, []);

  const loadData = useCallback(async () => {
    const [demandesRes, metaRes, clientsRes] = await Promise.all([
      fetch("/api/demandes"),
      fetch("/api/demandes/meta"),
      fetch("/api/clients"),
    ]);
    const demandesData = demandesRes.ok
      ? ((await demandesRes.json()) as ListDemandesResponse)
      : { demandes: [] };
    const metaData = metaRes.ok
      ? ((await metaRes.json()) as DemandeMetaResponse)
      : { admins: [], technicians: [], clients: [] };
    const clientsData = clientsRes.ok
      ? ((await clientsRes.json()) as { clients?: DemandeClientOption[] })
      : { clients: [] };

    setDemandes(demandesData.demandes ?? []);
    setAdmins(metaData.admins ?? []);
    setTechnicians(
      (metaData.technicians ?? []).map(
        (technician): TechnicienDisplay => ({
          id: Number(technician.id),
          userId: technician.userId ?? null,
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
    setClients(clientsData.clients ?? []);
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const currentTechnicianId = useMemo(() => {
    if (!user?.id) return undefined;
    const tech = technicians.find((t) => t.userId === user.id);
    return tech ? String(tech.id) : undefined;
  }, [technicians, user?.id]);

  const filtered = useMemo(() => {
    const result = filterDemandes(demandes, filters, currentTechnicianId);
    return [...result].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortDesc ? db - da : da - db;
    });
  }, [demandes, filters, sortDesc, currentTechnicianId]);

  return (
    <div className="page admin-demandes-page">
      <div className="admin-demandes-header">
        <div>
          <h1>Requêtes clients</h1>
          <p className="page-muted">
            Liste et suivi de toutes les demandes SAV.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-new-request"
          onClick={() => setShowModal(true)}
        >
          <FiPlus aria-hidden="true" />
          Nouvelle requête
        </button>
      </div>

      <AdminDemandeFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <p className="page-muted">Chargement…</p>
      ) : (
        <>
          <p className="demandes-count">
            {filtered.length} requête{filtered.length !== 1 ? "s" : ""}
          </p>
          <AdminDemandeTable
            demandes={filtered}
            clients={clients}
            admins={admins}
            technicians={technicians}
            currentUserId={currentTechnicianId}
            sortDesc={sortDesc}
            onToggleSort={() => setSortDesc((v) => !v)}
            onUpdated={(updated) => {
              setDemandes((prev) =>
                prev.map((demande) =>
                  demande.id === updated.id ? updated : demande,
                ),
              );
            }}
            onDeleted={(id) => {
              setDemandes((prev) => prev.filter((d) => d.id !== id));
            }}
          />
        </>
      )}

      {showModal && (
        <AdminCreateDemandeModal
          clients={clients}
          admins={admins}
          technicians={technicians}
          onClose={() => setShowModal(false)}
          onCreated={(demande) => {
            setDemandes((prev) => [demande, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
