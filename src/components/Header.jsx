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
          <span className="header-logo-text">Caustier</span>
        </Link>
      </div>

      <div className="header-actions">
        {user && (
          <span className="header-user-name">
            {user.displayName || user.nom}
          </span>
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
