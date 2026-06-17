"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { ACTIVE_STATUSES, CLOSED_STATUSES } from "@/lib/constants";

export default function DemandesPage() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/demandes")
      .then((res) => (res.ok ? res.json() : { demandes: [] }))
      .then((data) => setDemandes(data.demandes ?? []))
      .finally(() => setLoading(false));
  }, []);

  const actives = demandes.filter((d) => ACTIVE_STATUSES.includes(d.status));
  const history = demandes.filter((d) => CLOSED_STATUSES.includes(d.status));

  return (
    <PageLayout title="Mes demandes" description="Historique et suivi de vos demandes SAV.">
      {loading ? (
        <p className="page-muted">Chargement…</p>
      ) : (
        <>
          <section className="page-section">
            <h2>Demandes actives ({actives.length})</h2>
            {actives.length === 0 ? (
              <p className="page-muted">Aucune demande active.</p>
            ) : (
              <ul className="dashboard-list">
                {actives.map((d) => (
                  <li key={d.id}>
                    <Link href={`/demandes/${d.id}`} className="table-link">
                      #{d.id} — {d.titre}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="page-section">
            <h2>Historique ({history.length})</h2>
            {history.length === 0 ? (
              <p className="page-muted">Aucune demande terminée.</p>
            ) : (
              <ul className="dashboard-list">
                {history.map((d) => (
                  <li key={d.id}>
                    <Link href={`/demandes/${d.id}`} className="table-link">
                      #{d.id} — {d.titre}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </PageLayout>
  );
}
