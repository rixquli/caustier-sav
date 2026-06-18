import { RxDashboard } from "react-icons/rx";
import {
  MdOutlineSupportAgent,
  MdOutlineAdminPanelSettings,
} from "react-icons/md";
import { FiUsers, FiFileText, FiUser, FiHelpCircle } from "react-icons/fi";

export const ADMIN_ROUTES = ["/admin"];

export const adminNav = [
  { label: "Tableau de bord", icon: RxDashboard, href: "/" },
  {
    label: "Support",
    icon: MdOutlineSupportAgent,
    children: [
      { label: "FAQ", icon: FiHelpCircle, href: "/admin/faq" },
      { label: "Demandes SAV", icon: FiFileText, href: "/admin/demandes" },
    ],
  },
  {
    label: "Administration",
    icon: MdOutlineAdminPanelSettings,
    children: [{ label: "Clients", icon: FiUsers, href: "/admin/clients" }],
  },
];

export const clientNav = [
  { label: "Accueil", icon: RxDashboard, href: "/" },
  {
    label: "Support",
    icon: MdOutlineSupportAgent,
    children: [
      { label: "FAQ", icon: FiHelpCircle, href: "/faq" },
      { label: "Mes demandes", icon: FiFileText, href: "/demandes" },
    ],
  },
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
  return pathname === href;
}

export function getActiveChildHref(pathname, children) {
  return (
    children.find(({ href }) => isLinkActive(pathname, href))?.href ?? null
  );
}

export function isAdminRoute(pathname) {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
