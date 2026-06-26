import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <div className="page-container">
        <Sidebar />
        <main>{children}</main>;
      </div>
    </>
  );
}
