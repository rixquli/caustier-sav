import { BsPerson } from "react-icons/bs";
import { FaQuestionCircle } from "react-icons/fa";
import { IoTicketOutline } from "react-icons/io5";
import { MdOutlineSettings, MdSupportAgent } from "react-icons/md";
import { RxDashboard } from "react-icons/rx";
import { TfiMenuAlt } from "react-icons/tfi";

export const sidebarMenus = {
  client: [
    {
      name: "Tableau de bord",
      address: "/client/dashboard",
      icon: RxDashboard,
    },
    {
      name: "Support",
      icon: MdSupportAgent,
      children: [
        {
          name: "Tickets",
          address: "/client/tickets",
          icon: IoTicketOutline,
        },
        {
          name: "FAQ",
          address: "/client/faq",
          icon: FaQuestionCircle,
        },
      ],
    },
    {
      name: "Gestion",
      icon: MdOutlineSettings,
      children: [
        {
          name: "Mes équipements",
          address: "/client/equipments",
          icon: TfiMenuAlt,
        },
      ],
    },
  ],
  admin: [
    {
      name: "Tableau de bord",
      address: "/admin/dashboard",
      icon: RxDashboard,
    },
    {
      name: "Support",
      icon: MdSupportAgent,
      children: [
        {
          name: "Tickets",
          address: "/admin/tickets",
          icon: IoTicketOutline,
        },
        {
          name: "FAQ",
          address: "/admin/faq",
          icon: FaQuestionCircle,
        },
      ],
    },
    {
      name: "Gestion",
      icon: MdOutlineSettings,
      children: [
        {
          name: "Equipements",
          address: "/admin/equipments",
          icon: TfiMenuAlt,
        },
        {
          name: "Clients",
          address: "/admin/clients",
          icon: BsPerson,
        },
        {
          name: "Techniciens",
          address: "/admin/technicians",
          icon: BsPerson,
        },
      ],
    },
  ],
};
