"use client";
import { sidebarMenus } from "@/libs/navigations";
import Link from "next/link";
import { useState } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";

function SidebarSubElement({
  line,
}: {
  line: (typeof sidebarMenus.client)[0];
}) {
  if (!line.address) return;

  return (
    <Link className="sidebar-sub-element" href={line.address}>
      <line.icon size={20} />
      {line.name}
    </Link>
  );
}

function SidebarElement({ line }: { line: (typeof sidebarMenus.client)[0] }) {
  const [openMenu, setOpenMenu] = useState<boolean>(false);

  if (!line?.children)
    return (
      <Link className="sidebar-element" href={line.address}>
        <line.icon size={20} />
        {line.name}
      </Link>
    );
  else
    return (
      <>
        <button
          onClick={() => setOpenMenu((pre) => !pre)}
          className="sidebar-element"
        >
          <line.icon size={20} />
          {line.name}
          <AiOutlineArrowLeft
            className={`sidebar-dropdown-arrow ${openMenu ? "sidebar-dropdown-arrow-active" : ""}`}
          />
        </button>
        {openMenu && (
          <div className="sidebar-children-container">
            {line.children.map((child, i) => (
              <SidebarSubElement line={child} key={`sub-nav-${i}`} />
            ))}
          </div>
        )}
      </>
    );
}

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const list = isAdmin ? sidebarMenus.admin : sidebarMenus.client;
  return (
    <div className="sidebar">
      {list.map((line, i) => {
        return <SidebarElement line={line} key={`nav-${i}`}></SidebarElement>;
      })}
    </div>
  );
}
