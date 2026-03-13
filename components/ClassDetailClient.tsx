import Link from "next/link";

type Props = {
  classId: string;
  className: string;
  schoolId: string;
};

const actions = [
  {
    title: "Ir para Chamadas",
    href: (classId: string) => `/classes/${classId}/chamadas`,
    primary: true,
  },
  {
    title: "Ir para Conteúdos",
    href: (classId: string) => `/classes/${classId}/conteudos`,
    primary: false,
  },
  {
    title: "Relatório Chamadas",
    href: (classId: string) => `/classes/${classId}/relatorio-chamadas`,
    primary: false,
  },
  {
    title: "Conteúdos em PDF",
    href: (classId: string) => `/classes/${classId}/conteudos-pdf`,
    primary: false,
  },
  {
    title: "Ajuda com IA",
    href: (classId: string) => `/classes/${classId}/ai-help`,
    primary: false,
  },
];

export default function ClassDetailClient({
  classId,
  className,
  schoolId,
}: Props) {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-blue-600 px-4 py-10 text-white">
        <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-6">
          <Link
            href={`/schools/${schoolId}`}
            className="rounded-2xl bg-white/15 px-6 py-3 text-lg font-semibold text-white transition hover:bg-white/20"
          >
            Voltar
          </Link>

          <div className="max-w-xl text-right">
            <h1 className="text-3xl font-bold">{className}</h1>
            <p className="mt-3 text-lg text-white/90">
              Gerencie a turma acessando Chamadas e Conteúdos.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto w-full max-w-5xl rounded-[28px] border border-slate-300 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Ações</h2>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Use os atalhos abaixo para gerenciar a turma.
          </p>

          <div className="mt-8 space-y-5">
            {actions.map((action) => (
              <Link
                key={action.title}
                href={action.href(classId)}
                className={[
                  "block rounded-[22px] border px-6 py-6 text-center text-2xl font-semibold transition",
                  action.primary
                    ? "border-blue-600 bg-blue-600 text-white shadow-md hover:bg-blue-700"
                    : "border-slate-400 bg-white text-slate-800 hover:bg-slate-50",
                ].join(" ")}
              >
                {action.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
