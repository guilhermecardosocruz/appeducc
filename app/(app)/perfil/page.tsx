import { redirect } from "next/navigation";
import Link from "next/link";
import AccountProfileClient from "@/components/AccountProfileClient";
import { getSessionUser } from "@/lib/auth";

export default async function PerfilPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">

        {/* BOTÃO VOLTAR */}
        <Link href="/dashboard" className="mb-4 inline-block text-sm text-sky-700">
          ← Voltar
        </Link>

        <AccountProfileClient
          initialName={user.name}
          initialEmail={user.email}
          initialCpf={user.cpf ?? ""}
        />
      </div>
    </main>
  );
}
