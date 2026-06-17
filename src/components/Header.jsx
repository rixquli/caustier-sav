"use client";

import Link from "next/link";
import { FiUser, FiLogOut } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-logo">
        <span className="header-logo-text">Caustier</span>
      </div>

      <div className="header-actions">
        {user && (
          <span className="header-user-name">{user.displayName || user.nom}</span>
        )}
        <Link
          href={user?.role === "admin" ? "/admin/clients" : "/compte"}
          className="header-profile"
          aria-label="Profil utilisateur"
        >
          <FiUser className="header-profile-icon" aria-hidden="true" />
        </Link>
        <button
          type="button"
          className="header-profile"
          aria-label="Se déconnecter"
          onClick={logout}
        >
          <FiLogOut className="header-profile-icon" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
