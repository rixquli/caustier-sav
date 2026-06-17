"use client";

import Link from "next/link";

export default function AdminDashboard({ user }) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tableau de bord administrateur</h1>
        <p>Bienvenue, {user?.displayName || user?.nom}.</p>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <h2>Actions rapides</h2>
          <div className="quick-actions">
            <Link href="/admin/demandes" className="quick-action">Gérer les demandes</Link>
            <Link href="/admin/clients/new" className="quick-action">Créer un client</Link>
            <Link href="/admin/clients" className="quick-action">Liste des clients</Link>
            <Link href="/admin/faq" className="quick-action">Gérer la FAQ</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
