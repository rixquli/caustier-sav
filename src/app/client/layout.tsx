"use client";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const { data: session } = authClient.useSession();
  // const router = useRouter();

  // useEffect(() => {
  //   if (!session || !session?.user) router.push("/login");
  // }, [session, router]);
  return (
    <>
      <Header />
      <div className="page-container">
        <Sidebar />
        <main>{children}</main>
      </div>
    </>
  );
}
