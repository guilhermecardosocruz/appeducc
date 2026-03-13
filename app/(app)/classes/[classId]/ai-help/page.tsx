import Link from "next/link";

type PageProps = {
  params: Promise<{ classId: string }>;
};

export default async function ClassAiHelpPage({ params }: PageProps) {
  const { classId } = await params;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href={`/classes/${classId}`}
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          ← Voltar para turma
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Ajuda com IA
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Esta área será conectada ao suporte com IA da turma na próxima etapa.
          </p>
        </div>
      </div>
    </main>
  );
}
