"use client";

import { FiUsers, FiActivity, FiAlertCircle } from "react-icons/fi";

const stats = [
  { label: "Utilisateurs", value: "24", icon: FiUsers, color: "#acb134" },
  { label: "Demandes actives", value: "12", icon: FiActivity, color: "#3b82f6" },
  { label: "En attente", value: "5", icon: FiAlertCircle, color: "#f59e0b" },
];

export default function AdminDashboard({ user }) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tableau de bord administrateur</h1>
        <p>Bienvenue, {user?.nom}. Voici un aperçu de l&apos;activité.</p>
      </div>

      <div className="dashboard-stats">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-card-icon" style={{ backgroundColor: `${color}22`, color }}>
              <Icon aria-hidden="true" />
            </div>
            <div>
              <p className="stat-card-value">{value}</p>
              <p className="stat-card-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <h2>Dernières demandes</h2>
          <ul className="dashboard-list">
            <li>
              <span>#1042 — Réparation chaudière</span>
              <span className="badge badge--warning">En cours</span>
            </li>
            <li>
              <span>#1041 — Installation sanitaire</span>
              <span className="badge badge--success">Terminé</span>
            </li>
            <li>
              <span>#1040 — Devis remplacement</span>
              <span className="badge badge--info">Nouveau</span>
            </li>
          </ul>
        </section>

        <section className="dashboard-panel">
          <h2>Actions rapides</h2>
          <div className="quick-actions">
            <a href="/users/new" className="quick-action">Ajouter un utilisateur</a>
            <a href="/users" className="quick-action">Gérer les utilisateurs</a>
            <a href="/admin/stats" className="quick-action">Voir les statistiques</a>
          </div>
        </section>
      </div>
    </div>
  );
}
