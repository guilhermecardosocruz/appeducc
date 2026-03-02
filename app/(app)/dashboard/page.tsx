import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GroupsDashboardClient from "@/components/GroupsDashboardClient";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    // Se em algum momento tiver middleware de auth, isso quase não aparece.
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-xl text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Você precisa estar autenticado para acessar o painel.
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Faça login para organizar seus grupos de escolas, escolas, turmas e
            demais estruturas educativas.
          </p>
        </div>
      </main>
    );
  }

  const groupsRaw = await prisma.group.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      _count: { select: { schools: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const groups = groupsRaw.map((g) => ({
    id: g.id,
    name: g.name,
    createdAt: g.createdAt.toISOString(),
    _count: { schools: g._count.schools },
  }));

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-semibold text-slate-900">
          Organização das escolas
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          Aqui você gerencia sua estrutura educacional em níveis:{" "}
          <span className="font-medium">
            Grupos de escolas → Escolas → Turmas → Professores e Alunos
          </span>
          . Neste primeiro passo, vamos começar pelos grupos.
        </p>

        <GroupsDashboardClient
          initialGroups={groups}
          userName={user.name}
          userEmail={user.email}
        />
      </div>
    </main>
  );
}
