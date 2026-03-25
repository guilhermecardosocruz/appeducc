import Link from "next/link";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupReportsPage({ params }: PageProps) {
  const { groupId } = await params;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para o grupo
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">
          Relatórios do Grupo
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Gere relatórios de frequência por escola, turma e ranking de alunos.
        </p>

        <div className="mt-8 grid gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-medium text-slate-800">
              Frequência por escola
            </h2>
            <p className="text-sm text-slate-500">
              Média de presença e ranking de alunos faltantes por escola.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-medium text-slate-800">
              Frequência por turma
            </h2>
            <p className="text-sm text-slate-500">
              Presença dos alunos e médias por turma.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-medium text-slate-800">
              Ranking de alunos faltantes
            </h2>
            <p className="text-sm text-slate-500">
              Alunos com maior número de faltas no período.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
