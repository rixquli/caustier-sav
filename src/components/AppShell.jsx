"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const hideShell = pathname === "/login";

  if (hideShell) {
    return children;
  }

  return (
    <AuthProvider>
      <div className="app-shell">
        <Header />
        <Sidebar />
        <main className="app-main">{children}</main>
      </div>
    </AuthProvider>
  );
}
