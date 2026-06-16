import { RxDashboard } from "react-icons/rx";
import {
  FiUsers,
  FiSettings,
  FiFileText,
  FiUser,
  FiPlusCircle,
  FiBarChart2,
} from "react-icons/fi";

export const ADMIN_ROUTES = ["/users", "/settings", "/admin"];

export const adminNav = [
  {
    label: "Tableau de bord",
    icon: RxDashboard,
    href: "/",
  },
  {
    label: "Statistiques",
    icon: FiBarChart2,
    href: "/admin/stats",
  },
  {
    label: "Utilisateurs",
    icon: FiUsers,
    children: [
      { href: "/users", label: "Liste" },
      { href: "/users/new", label: "Ajouter" },
    ],
  },
  {
    label: "Paramètres",
    icon: FiSettings,
    children: [
      { href: "/settings", label: "Général" },
      { href: "/settings/security", label: "Sécurité" },
    ],
  },
];

export const clientNav = [
  {
    label: "Tableau de bord",
    icon: RxDashboard,
    href: "/",
  },
  {
    label: "Mes demandes",
    icon: FiFileText,
    href: "/demandes",
  },
  {
    label: "Mon compte",
    icon: FiUser,
    children: [
      { href: "/compte", label: "Profil" },
      { href: "/compte/factures", label: "Factures" },
    ],
  },
  {
    label: "Nouvelle demande",
    icon: FiPlusCircle,
    href: "/demandes/nouvelle",
  },
];

export function getNavForRole(role) {
  return role === "admin" ? adminNav : clientNav;
}

export function isNavItemSimple(item) {
  return Boolean(item.href) && !item.children?.length;
}

export function isNavItemGroup(item) {
  return Boolean(item.children?.length);
}

export function isLinkActive(pathname, href) {
  return pathname === href;
}

export function getActiveChildHref(pathname, children) {
  return children.find(({ href }) => href === pathname)?.href ?? null;
}

export function isAdminRoute(pathname) {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
