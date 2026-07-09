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
  type NavGroupItem,
  type NavItem,
  type NavLinkItem,
} from "@/lib/navigation";

type SidebarLinkProps = {
  item: NavLinkItem;
  pathname: string;
};

function SidebarLink({ item, pathname }: SidebarLinkProps) {
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

type SidebarGroupProps = {
  item: NavGroupItem;
  pathname: string;
};

function SidebarGroup({ item, pathname }: SidebarGroupProps) {
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
    <div
      className={`sidebar-group${hasActiveChild ? " sidebar-group--active" : ""}`}
    >
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
            const ChildIcon = child.icon;

            return (
              <Link
                key={child.href}
                href={child.href}
                className={`sidebar-sublink${active ? " sidebar-sublink--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <ChildIcon className="sidebar-children-icon" aria-hidden="true" />
                <span>{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

type SidebarItemProps = {
  item: NavItem;
  pathname: string;
};

function SidebarItem({ item, pathname }: SidebarItemProps) {
  if (isNavItemSimple(item)) {
    return <SidebarLink item={item} pathname={pathname} />;
  }

  if (isNavItemGroup(item)) {
    return <SidebarGroup item={item} pathname={pathname} />;
  }

  return null;
}

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ open = false }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const navItems = user ? getNavForRole(user.role) : [];

  return (
    <aside className={`sidebar${open ? " sidebar--open" : ""}`}>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <SidebarItem key={item.label} item={item} pathname={pathname} />
        ))}
      </nav>
    </aside>
  );
}
