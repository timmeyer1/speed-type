import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/layout/Header";
import SessionProviderWrapper from "@/components/auth/SessionProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpeedType",
  description: "Test ta vitesse de frappe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <Header />
          <main className="p-4">{children}</main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
