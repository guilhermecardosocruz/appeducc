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
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/schools/${schoolId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para turmas
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{className}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gerencie a turma acessando chamadas, conteúdos, relatórios e ações
            de apoio.
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ações</h2>
          <p className="mt-2 text-sm text-slate-500">
            Use os atalhos abaixo para gerenciar a turma.
          </p>

          <div className="mt-6 space-y-3">
            {actions.map((action) => (
              <Link
                key={action.title}
                href={action.href(classId)}
                className={[
                  "block rounded-md border px-4 py-4 text-center text-base font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500",
                  action.primary
                    ? "border-sky-600 bg-sky-600 text-white hover:bg-sky-700"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
                ].join(" ")}
              >
                {action.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
