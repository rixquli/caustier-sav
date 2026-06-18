import { Roboto } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

export const metadata = {
  title: "Caustier SAV",
  description: "Plateforme de gestion des demandes SAV Caustier",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={roboto.variable}>
      <body className={roboto.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
