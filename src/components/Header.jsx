"use client";

import { FiSearch, FiUser, FiLogOut } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-logo">
        <span className="header-logo-text">Caustier</span>
      </div>

      <div className="header-search">
        <FiSearch className="header-search-icon" aria-hidden="true" />
        <input
          type="search"
          className="header-search-input"
          placeholder="Rechercher..."
          aria-label="Rechercher"
        />
      </div>

      <div className="header-actions">
        {user && (
          <span className="header-user-name">{user.nom}</span>
        )}
        <button
          type="button"
          className="header-profile"
          aria-label="Profil utilisateur"
        >
          <FiUser className="header-profile-icon" aria-hidden="true" />
        </button>
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
