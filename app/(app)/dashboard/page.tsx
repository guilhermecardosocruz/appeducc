import { getSessionUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getSessionUser();

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Aqui vai ser todo o fluxo de organização das escolas.
        </h1>
        {user && (
          <p className="mt-3 text-sm text-slate-500">
            Você está logado como{" "}
            <span className="font-medium">
              {user.name} ({user.email})
            </span>
            .
          </p>
        )}
      </div>
    </main>
  );
}
