import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-6">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <LoginForm />
      <p className="text-sm">
        Pas encore de compte ? <Link href="/register" className="underline">Inscription</Link>
      </p>
    </div>
  );
}
