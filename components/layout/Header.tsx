"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white px-4 py-3 flex justify-between items-center shadow-sm">
      <Link href="/" className="text-xl font-bold text-blue-600">
        SpeedType
      </Link>

      <div className="flex items-center gap-4">
        {session?.user ? (
          <>
            <span className="text-sm text-gray-700">Salut, {session.user.name}</span>
            <Link href="/profile">
              <Button variant="outline" size="sm">Profil</Button>
            </Link>
            <Button variant="destructive" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              Déconnexion
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button size="sm">Connexion</Button>
          </Link>
        )}
      </div>
    </header>
  );
}