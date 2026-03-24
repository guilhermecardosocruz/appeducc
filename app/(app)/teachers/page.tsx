import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeachersListClient from "@/components/TeachersListClient";

export default async function TeachersPage() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const teachersRaw = await prisma.user.findMany({
    where: {
      createdById: user.id,
      isTeacher: true,
    },
    include: {
      _count: {
        select: {
          classes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const teachers = teachersRaw.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    createdAt: teacher.createdAt.toISOString(),
    _count: {
      classes: teacher._count.classes,
    },
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-2xl font-semibold text-slate-900">
          Professores
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Cadastre professores e gerencie vínculos com turmas.
        </p>

        <TeachersListClient initialTeachers={teachers} title="Lista de professores" />
      </div>
    </main>
  );
}
