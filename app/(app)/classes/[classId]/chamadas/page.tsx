import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ classId: string }>;
};

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

export default async function ClassChamadasPage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { classId } = await params;

  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
      attendances: {
        include: {
          presences: {
            select: {
              id: true,
              present: true,
            },
          },
        },
        orderBy: [{ lessonDate: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!foundClass) {
    notFound();
  }

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId: user.id,
          schoolId: foundClass.schoolId,
        },
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: foundClass.school.groupId,
        },
      },
    }),
  ]);

  const hasAccess = Boolean(schoolMembership) || Boolean(groupMembership);
  const canManage =
    Boolean(schoolMembership) ||
    Boolean(groupMembership && canManageGroupRole(groupMembership.role));

  if (!hasAccess) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/classes/${classId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para turma
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Chamadas — {foundClass.name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Gerencie as chamadas desta turma.
            </p>
            {!canManage ? (
              <p className="mt-2 text-sm text-amber-700">
                Você está com acesso somente de visualização neste módulo.
              </p>
            ) : null}
          </div>

          {canManage ? (
            <Link
              href={`/classes/${classId}/chamadas/new`}
              className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
            >
              + Nova chamada
            </Link>
          ) : null}
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {foundClass.attendances.length === 0 ? (
            <div className="text-center">
              <p className="text-sm text-slate-500">
                Ainda não há chamadas nesta turma.
              </p>

              {canManage ? (
                <Link
                  href={`/classes/${classId}/chamadas/new`}
                  className="mt-4 inline-flex items-center rounded-md border border-sky-600 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                >
                  Criar primeira chamada
                </Link>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-3">
              {foundClass.attendances.map((attendance) => {
                const total = attendance.presences.length;
                const presents = attendance.presences.filter(
                  (item) => item.present
                ).length;

                return (
                  <li key={attendance.id}>
                    <Link
                      href={`/classes/${classId}/chamadas/${attendance.id}`}
                      className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {attendance.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {attendance.lessonDate.toLocaleDateString("pt-BR")} •{" "}
                          {presents} presentes de {total}
                        </p>
                      </div>

                      <span className="text-sm font-medium text-sky-700">
                        Abrir
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
