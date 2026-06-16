"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiChevronDown } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import {
  getActiveChildHref,
  getNavForRole,
  isLinkActive,
  isNavItemGroup,
  isNavItemSimple,
} from "@/lib/navigation";

function SidebarLink({ item, pathname }) {
  const Icon = item.icon;
  const active = isLinkActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={`sidebar-link${active ? " sidebar-link--active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="sidebar-link-icon" aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

function SidebarGroup({ item, pathname }) {
  const activeChildHref = getActiveChildHref(pathname, item.children);
  const hasActiveChild = activeChildHref !== null;
  const [open, setOpen] = useState(hasActiveChild);
  const Icon = item.icon;

  useEffect(() => {
    if (hasActiveChild) {
      setOpen(true);
    }
  }, [hasActiveChild, pathname]);

  return (
    <div className={`sidebar-group${hasActiveChild ? " sidebar-group--active" : ""}`}>
      <button
        type="button"
        className={`sidebar-group-toggle${hasActiveChild ? " sidebar-group-toggle--active" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <Icon className="sidebar-link-icon" aria-hidden="true" />
        <span className="sidebar-group-label">{item.label}</span>
        <FiChevronDown
          className={`sidebar-group-chevron${open ? " sidebar-group-chevron--open" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="sidebar-subnav">
          {item.children.map((child) => {
            const active = activeChildHref === child.href;

            return (
              <Link
                key={child.href}
                href={child.href}
                className={`sidebar-sublink${active ? " sidebar-sublink--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span>{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidebarItem({ item, pathname }) {
  if (isNavItemSimple(item)) {
    return <SidebarLink item={item} pathname={pathname} />;
  }

  if (isNavItemGroup(item)) {
    return <SidebarGroup item={item} pathname={pathname} />;
  }

  return null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const navItems = user ? getNavForRole(user.role) : [];

  return (
    <aside className="sidebar">
      {!loading && user && (
        <div className="sidebar-user">
          <span className="sidebar-user-name">{user.nom}</span>
          <span className="sidebar-user-role">
            {user.role === "admin" ? "Administrateur" : "Client"}
          </span>
        </div>
      )}

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <SidebarItem key={item.label} item={item} pathname={pathname} />
        ))}
      </nav>
    </aside>
  );
}
