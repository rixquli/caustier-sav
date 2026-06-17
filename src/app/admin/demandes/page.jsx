"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus } from "react-icons/fi";
import AdminCreateDemandeModal from "@/components/AdminCreateDemandeModal";
import AdminDemandeFilters, { filterDemandes } from "@/components/AdminDemandeFilters";
import AdminDemandeTable from "@/components/AdminDemandeTable";

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  type: "",
  priorite: "",
  clientId: "",
};

export default function AdminDemandesPage() {
  const [demandes, setDemandes] = useState([]);
  const [clients, setClients] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortDesc, setSortDesc] = useState(true);

  const loadData = useCallback(async () => {
    const [demandesRes, metaRes, clientsRes] = await Promise.all([
      fetch("/api/demandes"),
      fetch("/api/demandes/meta"),
      fetch("/api/clients"),
    ]);
    const demandesData = demandesRes.ok ? await demandesRes.json() : { demandes: [] };
    const metaData = metaRes.ok ? await metaRes.json() : { admins: [] };
    const clientsData = clientsRes.ok ? await clientsRes.json() : { clients: [] };
    setDemandes(demandesData.demandes ?? []);
    setAdmins(metaData.admins ?? []);
    setClients(clientsData.clients ?? []);
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const filtered = useMemo(() => {
    const result = filterDemandes(demandes, filters);
    return [...result].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortDesc ? db - da : da - db;
    });
  }, [demandes, filters, sortDesc]);

  return (
    <div className="page admin-demandes-page">
      <div className="admin-demandes-header">
        <div>
          <h1>Requêtes clients</h1>
          <p className="page-muted">Liste et suivi de toutes les demandes SAV.</p>
        </div>
        <button type="button" className="btn btn-primary btn-new-request" onClick={() => setShowModal(true)}>
          <FiPlus aria-hidden="true" />
          Nouvelle requête
        </button>
      </div>

      <AdminDemandeFilters filters={filters} onChange={setFilters} clients={clients} />

      {loading ? (
        <p className="page-muted">Chargement…</p>
      ) : (
        <>
          <p className="demandes-count">{filtered.length} requête{filtered.length !== 1 ? "s" : ""}</p>
          <AdminDemandeTable
            demandes={filtered}
            sortDesc={sortDesc}
            onToggleSort={() => setSortDesc((v) => !v)}
          />
        </>
      )}

      {showModal && (
        <AdminCreateDemandeModal
          clients={clients}
          admins={admins}
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
