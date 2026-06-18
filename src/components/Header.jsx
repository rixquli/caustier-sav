"use client";

import Link from "next/link";
import { FiUser, FiLogOut, FiMenu } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";

export default function Header({ onToggleNav, navOpen }) {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className="header-menu-btn"
          aria-label="Ouvrir le menu"
          aria-expanded={navOpen}
          onClick={onToggleNav}
        >
          <FiMenu aria-hidden="true" />
        </button>
        <Link href={"/"} className="header-logo">
          <span className="header-logo-mark">C</span>
          <span className="header-brand">
            <span className="header-logo-text">Caustier</span>
            <span className="header-subtitle">Suivi Clients</span>
          </span>
        </Link>
      </div>

      <div className="header-actions">
        {user && (
          <Link
            href={user?.role === "admin" ? "/admin/clients" : "/compte"}
            className="header-user-chip"
            aria-label="Profil utilisateur"
          >
            <span className="header-avatar">
              <FiUser aria-hidden="true" />
            </span>
            <span className="header-user-name">
              {user.displayName || user.nom}
            </span>
          </Link>
        )}
        <button
          type="button"
          className="header-logout"
          aria-label="Se déconnecter"
          onClick={logout}
        >
          <FiLogOut aria-hidden="true" />
          <span>Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
