import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GroupsDashboardClient from "@/components/GroupsDashboardClient";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
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

  const [groupMemberships, schoolMemberships, teachersRaw] = await Promise.all([
    prisma.groupMember.findMany({
      where: {
        userId: user.id,
      },
      include: {
        group: {
          include: {
            _count: { select: { schools: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.schoolMember.findMany({
      where: {
        userId: user.id,
      },
      include: {
        school: {
          include: {
            group: {
              include: {
                _count: { select: { schools: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
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
    }),
  ]);

  const groupsMap = new Map<
    string,
    {
      id: string;
      name: string;
      createdAt: string;
      _count: { schools: number };
    }
  >();

  for (const membership of groupMemberships) {
    groupsMap.set(membership.group.id, {
      id: membership.group.id,
      name: membership.group.name,
      createdAt: membership.group.createdAt.toISOString(),
      _count: { schools: membership.group._count.schools },
    });
  }

  for (const membership of schoolMemberships) {
    const group = membership.school.group;

    if (!groupsMap.has(group.id)) {
      groupsMap.set(group.id, {
        id: group.id,
        name: group.name,
        createdAt: group.createdAt.toISOString(),
        _count: { schools: group._count.schools },
      });
    }
  }

  const groups = Array.from(groupsMap.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  const teachers = teachersRaw.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    isTeacher: teacher.isTeacher,
    createdAt: teacher.createdAt.toISOString(),
    _count: {
      classes: teacher._count.classes,
    },
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-2xl font-semibold text-slate-900">
          Organização das escolas
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Aqui você gerencia sua estrutura educacional em níveis:{" "}
          <span className="font-medium">
            Grupos de escolas → Escolas → Turmas → Professores e Alunos
          </span>
          .
        </p>

        <GroupsDashboardClient
          initialGroups={groups}
          initialTeachers={teachers}
          userName={user.name}
          userEmail={user.email}
        />
      </div>
    </main>
  );
}
