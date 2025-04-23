import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-6">
      <h1 className="text-2xl font-bold">Inscription</h1>
      <RegisterForm />
      <p className="text-sm">
        Déjà inscrit ? <Link href="/login" className="underline">Connexion</Link>
      </p>
    </div>
  );
}
