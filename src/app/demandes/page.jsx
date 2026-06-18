"use client";

import { useCallback, useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { DemandeCardList } from "@/components/DemandeList";
import ClientCreateDemandeModal from "@/components/ClientCreateDemandeModal";
import { ACTIVE_STATUSES, CLOSED_STATUSES } from "@/lib/constants";

export default function DemandesPage() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadDemandes = useCallback(() => {
    return fetch("/api/demandes")
      .then((res) => (res.ok ? res.json() : { demandes: [] }))
      .then((data) => setDemandes(data.demandes ?? []));
  }, []);

  useEffect(() => {
    loadDemandes().finally(() => setLoading(false));
  }, [loadDemandes]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("nouvelle") === "1") {
      setShowModal(true);
    }
  }, []);

  const actives = demandes.filter((d) => ACTIVE_STATUSES.includes(d.status));
  const history = demandes.filter((d) => CLOSED_STATUSES.includes(d.status));

  return (
    <div className="page">
      <div className="admin-demandes-header">
        <div>
          <h1>Mes demandes</h1>
          <p className="page-muted">Historique et suivi de vos demandes SAV.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-new-request"
          onClick={() => setShowModal(true)}
        >
          <FiPlus aria-hidden="true" />
          Nouvelle demande
        </button>
      </div>

      {loading ? (
        <p className="page-muted">Chargement…</p>
      ) : (
        <>
          <section className="page-section">
            <h2>Demandes actives ({actives.length})</h2>
            {actives.length === 0 ? (
              <p className="page-muted">Aucune demande active.</p>
            ) : (
              <DemandeCardList demandes={actives} />
            )}
          </section>
          <section className="page-section">
            <h2>Historique ({history.length})</h2>
            {history.length === 0 ? (
              <p className="page-muted">Aucune demande terminée.</p>
            ) : (
              <DemandeCardList demandes={history} />
            )}
          </section>
        </>
      )}

      {showModal && (
        <ClientCreateDemandeModal
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
