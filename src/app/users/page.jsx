"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => setUsers(data.users ?? []))
      .finally(() => setLoading(false));
  }, []);

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR");
  }

  return (
    <PageLayout
      title="Utilisateurs"
      description="Liste de tous les clients enregistrés."
    >
      {loading ? (
        <p className="page-muted">Chargement…</p>
      ) : users.length === 0 ? (
        <div className="page-card">
          <p>Aucun utilisateur.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Téléphone</th>
                <th>Créé le</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.nom}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === "admin" ? "badge--info" : "badge--muted"}`}>
                      {user.role === "admin" ? "Admin" : "Client"}
                    </span>
                  </td>
                  <td>{user.phone || "—"}</td>
                  <td>{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
}
