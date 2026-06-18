"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DemandeCardList } from "@/components/DemandeList";

export default function ClientDashboard({ user }) {
  const [actives, setActives] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setActives(data?.actives ?? []);
        setHistory(data?.history ?? []);
      });
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Mon espace client</h1>
          <p>Bonjour {user?.displayName || user?.nom}, suivez vos demandes SAV.</p>
        </div>
        <Link href="/demandes/nouvelle" className="dashboard-primary-cta">
          <span>Créer une demande SAV</span>
          <small>Panne, question ou intervention</small>
        </Link>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <h2>Demandes actives</h2>
          <DemandeCardList demandes={actives} />
        </section>

        <section className="dashboard-panel">
          <h2>Historique</h2>
          <DemandeCardList demandes={history} />
        </section>

        <section className="dashboard-panel">
          <h2>Actions rapides</h2>
          <div className="quick-actions">
            <Link href="/demandes/nouvelle" className="quick-action quick-action--primary">
              Créer une demande SAV
            </Link>
            <Link href="/demandes" className="quick-action">Voir toutes mes demandes</Link>
            <Link href="/faq" className="quick-action">Consulter la FAQ</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
