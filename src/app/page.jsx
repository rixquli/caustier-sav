"use client";

import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/AdminDashboard";
import ClientDashboard from "@/components/ClientDashboard";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page">
        <p className="page-muted">Chargement…</p>
      </div>
    );
  }

  if (user?.role === "admin") {
    return <AdminDashboard user={user} />;
  }

  return <ClientDashboard user={user} />;
}
