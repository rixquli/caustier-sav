import { RxDashboard } from "react-icons/rx";
import {
  FiUsers,
  FiFileText,
  FiUser,
  FiPlusCircle,
  FiHelpCircle,
} from "react-icons/fi";

export const ADMIN_ROUTES = ["/admin"];

export const adminNav = [
  { label: "Tableau de bord", icon: RxDashboard, href: "/" },
  { label: "Demandes SAV", icon: FiFileText, href: "/admin/demandes" },
  { label: "Clients", icon: FiUsers, href: "/admin/clients" },
  { label: "FAQ", icon: FiHelpCircle, href: "/admin/faq" },
];

export const clientNav = [
  { label: "Accueil", icon: RxDashboard, href: "/" },
  { label: "Mes demandes", icon: FiFileText, href: "/demandes" },
  { label: "Nouvelle demande", icon: FiPlusCircle, href: "/demandes/nouvelle" },
  { label: "FAQ", icon: FiHelpCircle, href: "/faq" },
  { label: "Mon profil", icon: FiUser, href: "/compte" },
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
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveChildHref(pathname, children) {
  return children.find(({ href }) => isLinkActive(pathname, href))?.href ?? null;
}

export function isAdminRoute(pathname) {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
