"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiUser,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiChevronDown,
  FiHelpCircle,
  FiFileText,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import NotificationBell from "@/components/NotificationBell";
import type { SearchResponse } from "@/types/user";

const EMPTY_RESULTS: SearchResponse = { faq: [], demandes: [], clients: [] };

type HeaderProps = {
  onToggleNav: () => void;
  navOpen: boolean;
};

export default function Header({ onToggleNav, navOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>(EMPTY_RESULTS);
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "admin";
  const profileHref = "/compte";

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : EMPTY_RESULTS))
        .then((data: SearchResponse) => {
          setResults({
            faq: data.faq ?? [],
            demandes: data.demandes ?? [],
            clients: data.clients ?? [],
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const base = isAdmin ? "/admin/demandes" : "/demandes";
    go(`${base}?q=${encodeURIComponent(q)}`);
  }

  const faqHref = (id: number) => (isAdmin ? `/admin/faq/${id}` : `/faq`);
  const demandeHref = (id: number) =>
    isAdmin ? `/admin/demandes/${id}` : `/demandes/${id}`;
  const clientHref = (id: string) => `/admin/clients/${id}`;

  const total =
    results.faq.length + results.demandes.length + results.clients.length;
  const hasQuery = query.trim().length >= 2;
  const showDropdown = open && hasQuery;

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
          <span className="header-logo-mark">
            <Image src={"/favicon.ico"} alt="logo" width={35} height={35} />
          </span>
          <span className="header-brand">
            <span className="header-logo-text">Caustier</span>
            <span className="header-subtitle">Suivi Clients</span>
          </span>
        </Link>
      </div>

      <div className="header-search" ref={containerRef}>
        <form
          className="header-search-form"
          onSubmit={handleSearch}
          role="search"
        >
          <FiSearch className="header-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="header-search-input"
            placeholder="Rechercher une FAQ, une demande, un client…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            aria-label="Rechercher"
            autoComplete="off"
          />

          {showDropdown && (
            <div className="search-dropdown" role="listbox">
              {loading && total === 0 ? (
                <p className="search-dropdown-empty">Recherche…</p>
              ) : total === 0 ? (
                <p className="search-dropdown-empty">Aucun résultat.</p>
              ) : (
                <>
                  {results.faq.length > 0 && (
                    <div className="search-group">
                      <p className="search-group-title">
                        <FiHelpCircle aria-hidden="true" /> FAQ
                      </p>
                      {results.faq.map((item) => (
                        <button
                          key={`faq-${item.id}`}
                          type="button"
                          className="search-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => go(faqHref(item.id))}
                        >
                          <span className="search-item-main">
                            {item.question}
                          </span>
                          {item.categorie && (
                            <span className="search-item-sub">
                              {item.categorie}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {results.demandes.length > 0 && (
                    <div className="search-group">
                      <p className="search-group-title">
                        <FiFileText aria-hidden="true" /> Demandes
                      </p>
                      {results.demandes.map((item) => (
                        <button
                          key={`demande-${item.id}`}
                          type="button"
                          className="search-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => go(demandeHref(item.id))}
                        >
                          <span className="search-item-main">
                            #{item.id} · {item.titre}
                          </span>
                          {item.client && (
                            <span className="search-item-sub">
                              {item.client}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {results.clients.length > 0 && (
                    <div className="search-group">
                      <p className="search-group-title">
                        <FiUsers aria-hidden="true" /> Clients
                      </p>
                      {results.clients.map((item) => (
                        <button
                          key={`client-${item.id}`}
                          type="button"
                          className="search-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => go(clientHref(item.id))}
                        >
                          <span className="search-item-main">
                            {item.displayName}
                          </span>
                          {item.email && (
                            <span className="search-item-sub">
                              {item.email}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </form>
      </div>

      <div className="header-actions">
        {user && <NotificationBell isAdmin={isAdmin} />}
        {user && (
          <div className="header-user-menu" ref={userMenuRef}>
            <button
              type="button"
              className="header-user-chip"
              aria-label="Menu du compte"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              onClick={() => setUserMenuOpen((open) => !open)}
            >
              <span className="header-avatar">
                <FiUser aria-hidden="true" />
              </span>
              <span className="header-user-name">
                {user.email || user.displayName || user.nom}
              </span>
              <FiChevronDown
                className={`header-user-chevron${userMenuOpen ? " header-user-chevron--open" : ""}`}
                aria-hidden="true"
              />
            </button>
            {userMenuOpen && (
              <div className="header-user-dropdown" role="menu">
                <Link
                  href={profileHref}
                  className="header-user-dropdown-item"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <FiUser aria-hidden="true" />
                  Modifier le profil
                </Link>
              </div>
            )}
          </div>
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
