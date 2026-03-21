import { redirect } from "next/navigation";
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
        <AccountProfileClient
          initialName={user.name}
          initialEmail={user.email}
          initialCpf={user.cpf ?? ""}
        />
      </div>
    </main>
  );
}
