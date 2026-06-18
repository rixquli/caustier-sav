"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiInbox,
  FiActivity,
  FiUserX,
  FiAlertTriangle,
  FiUsers,
  FiCheckCircle,
} from "react-icons/fi";
import { DemandeCardList } from "@/components/DemandeList";

const DEFAULT_STATS = {
  totalDemandes: 0,
  actives: 0,
  nonAttribuees: 0,
  prioritaires: 0,
  clients: 0,
  resolues: 0,
};

export default function AdminDashboard({ user }) {
  const [dashboard, setDashboard] = useState({
    stats: DEFAULT_STATS,
    unassigned: [],
    highPriority: [],
    recent: [],
  });

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setDashboard({
          stats: data.stats ?? DEFAULT_STATS,
          unassigned: data.unassigned ?? [],
          highPriority: data.highPriority ?? [],
          recent: data.recent ?? [],
        });
      });
  }, []);

  const { stats, unassigned, highPriority, recent } = dashboard;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Tableau de bord administrateur</h1>
          <p>Bienvenue, {user?.displayName || user?.nom}.</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-icon">
            <FiInbox aria-hidden="true" />
          </div>
          <div>
            <p className="stat-card-value">{stats.totalDemandes}</p>
            <p className="stat-card-label">Demandes totales</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">
            <FiActivity aria-hidden="true" />
          </div>
          <div>
            <p className="stat-card-value">{stats.actives}</p>
            <p className="stat-card-label">Demandes actives</p>
          </div>
        </div>
        <div className="stat-card stat-card--warning">
          <div className="stat-card-icon">
            <FiUserX aria-hidden="true" />
          </div>
          <div>
            <p className="stat-card-value">{stats.nonAttribuees}</p>
            <p className="stat-card-label">Non attribuées</p>
          </div>
        </div>
        <div className="stat-card stat-card--danger">
          <div className="stat-card-icon">
            <FiAlertTriangle aria-hidden="true" />
          </div>
          <div>
            <p className="stat-card-value">{stats.prioritaires}</p>
            <p className="stat-card-label">Haute priorité</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">
            <FiCheckCircle aria-hidden="true" />
          </div>
          <div>
            <p className="stat-card-value">{stats.resolues}</p>
            <p className="stat-card-label">Résolues</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">
            <FiUsers aria-hidden="true" />
          </div>
          <div>
            <p className="stat-card-value">{stats.clients}</p>
            <p className="stat-card-label">Clients suivis</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel dashboard-panel--wide">
          <div className="dashboard-panel-header">
            <div>
              <h2>Demandes non attribuées</h2>
              <p>À assigner rapidement à un technicien.</p>
            </div>
            <Link href="/admin/demandes" className="table-link">Voir tout</Link>
          </div>
          <DemandeCardList
            demandes={unassigned}
            detailBasePath="/admin/demandes"
            showClient
            emptyMessage="Toutes les demandes actives sont attribuées."
          />
        </section>

        <section className="dashboard-panel dashboard-panel--wide">
          <div className="dashboard-panel-header">
            <div>
              <h2>Priorités haute et critique</h2>
              <p>Demandes actives triées du niveau le plus urgent au moins urgent.</p>
            </div>
            <Link href="/admin/demandes" className="table-link">Voir tout</Link>
          </div>
          <DemandeCardList
            demandes={highPriority}
            detailBasePath="/admin/demandes"
            showClient
            emptyMessage="Aucune demande haute ou critique active."
          />
        </section>

        <section className="dashboard-panel dashboard-panel--actions">
          <h2>Actions rapides</h2>
          <div className="quick-actions">
            <Link href="/admin/demandes" className="quick-action">Gérer les demandes</Link>
            <Link href="/admin/clients/new" className="quick-action">Créer un client</Link>
            <Link href="/admin/clients" className="quick-action">Liste des clients</Link>
            <Link href="/admin/faq" className="quick-action">Gérer la FAQ</Link>
          </div>
        </section>
      </div>

      <section className="dashboard-panel dashboard-recent">
        <div className="dashboard-panel-header">
          <div>
            <h2>Dernières requêtes</h2>
            <p>Les demandes les plus récentes, tous statuts confondus.</p>
          </div>
          <Link href="/admin/demandes" className="table-link">Voir tout</Link>
        </div>
        <DemandeCardList
          demandes={recent.slice(0, 8)}
          detailBasePath="/admin/demandes"
          showClient
          emptyMessage="Aucune demande enregistrée."
        />
      </section>
    </div>
  );
}
