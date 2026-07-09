import type { IconType } from "react-icons";
import { RxDashboard } from "react-icons/rx";
import {
  MdOutlineSupportAgent,
  MdOutlineAdminPanelSettings,
} from "react-icons/md";
import { FiUsers, FiFileText, FiUser, FiHelpCircle } from "react-icons/fi";
import type { UserRole } from "@/types/user";

export type NavLinkItem = {
  label: string;
  icon: IconType;
  href: string;
};

export type NavGroupItem = {
  label: string;
  icon: IconType;
  children: NavLinkItem[];
};

export type NavItem = NavLinkItem | NavGroupItem;

export const ADMIN_ROUTES = ["/admin"];

export const adminNav: NavItem[] = [
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
    children: [
      { label: "Clients", icon: FiUsers, href: "/admin/clients" },
      { label: "Techniciens", icon: FiUser, href: "/admin/techniciens" },
    ],
  },
];

export const clientNav: NavItem[] = [
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

export function getNavForRole(role: UserRole): NavItem[] {
  return role === "admin" ? adminNav : clientNav;
}

export function isNavItemSimple(item: NavItem): item is NavLinkItem {
  return "href" in item && !isNavItemGroup(item);
}

export function isNavItemGroup(item: NavItem): item is NavGroupItem {
  return "children" in item && Boolean(item.children?.length);
}

export function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href;
}

export function getActiveChildHref(
  pathname: string,
  children: NavLinkItem[],
): string | null {
  return (
    children.find(({ href }) => isLinkActive(pathname, href))?.href ?? null
  );
}

export function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
