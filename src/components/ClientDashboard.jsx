"use client";

import { FiFileText, FiCheckCircle, FiClock } from "react-icons/fi";

const stats = [
  { label: "Demandes ouvertes", value: "2", icon: FiFileText, color: "#3b82f6" },
  { label: "Terminées", value: "8", icon: FiCheckCircle, color: "#22c55e" },
  { label: "En attente", value: "1", icon: FiClock, color: "#f59e0b" },
];

export default function ClientDashboard({ user }) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Mon espace client</h1>
        <p>Bonjour {user?.nom}, suivez vos demandes et votre compte.</p>
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
          <h2>Mes dernières demandes</h2>
          <ul className="dashboard-list">
            <li>
              <span>#1042 — Réparation chaudière</span>
              <span className="badge badge--warning">En cours</span>
            </li>
            <li>
              <span>#1038 — Entretien annuel</span>
              <span className="badge badge--success">Terminé</span>
            </li>
          </ul>
        </section>

        <section className="dashboard-panel">
          <h2>Actions rapides</h2>
          <div className="quick-actions">
            <a href="/demandes/nouvelle" className="quick-action">Nouvelle demande</a>
            <a href="/demandes" className="quick-action">Voir mes demandes</a>
            <a href="/compte/factures" className="quick-action">Mes factures</a>
          </div>
        </section>
      </div>
    </div>
  );
}
