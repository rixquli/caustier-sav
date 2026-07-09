"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const hideShell = pathname === "/login";

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (hideShell) {
    return children;
  }

  return (
    <AuthProvider>
      <div className="app-shell">
        <Header onToggleNav={() => setNavOpen((v) => !v)} navOpen={navOpen} />
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
        {navOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
        )}
        <main className="app-main">{children}</main>
      </div>
    </AuthProvider>
  );
}
