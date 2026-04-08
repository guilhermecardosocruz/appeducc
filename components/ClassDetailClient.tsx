import Link from "next/link";

type Props = {
  classId: string;
  className: string;
  schoolId: string;
  canManageClass: boolean;
};

const actions = [
  {
    title: "Chamadas",
    href: (classId: string) => `/classes/${classId}/chamadas`,
    primary: true,
  },
  {
    title: "Conteúdos",
    href: (classId: string) => `/classes/${classId}/conteudos`,
    primary: false,
  },
  {
    title: "Horários",
    href: (classId: string) => `/classes/${classId}/horarios`,
    primary: false,
  },
  {
    title: "Ajuda com IA",
    href: (classId: string) => `/classes/${classId}/ai-help`,
    primary: false,
  },
  {
    title: "Galeria",
    href: (classId: string) => `/classes/${classId}/gallery`,
    primary: false,
  },
];

export default function ClassDetailClient({
  classId,
  className,
  schoolId,
  canManageClass,
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
          {!canManageClass && (
            <p className="mt-2 text-sm text-amber-700">
              Você está com acesso somente de visualização nesta turma.
            </p>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mt-6 space-y-3">
            {actions.map((action) => (
              <Link
                key={action.title}
                href={action.href(classId)}
                className="block rounded-md border px-4 py-4 text-center"
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
