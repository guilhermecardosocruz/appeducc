import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeachersListClient from "@/components/TeachersListClient";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

function isGroupManagerRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

export default async function GroupTeachersPage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { groupId } = await params;

  const groupMembership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
    include: {
      group: true,
    },
  });

  if (!groupMembership) {
    notFound();
  }

  if (!isGroupManagerRole(groupMembership.role)) {
    notFound();
  }

  const memberIds = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  const memberUserIds = memberIds.map((item) => item.userId);

  const teachersRaw = await prisma.user.findMany({
    where: {
      isTeacher: true,
      OR: [
        {
          createdById: {
            in: memberUserIds,
          },
        },
        {
          schoolMembers: {
            some: {
              school: {
                groupId,
              },
            },
          },
        },
      ],
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
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para grupo
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">
          Professores do grupo
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Cadastre professores e gerencie os docentes relacionados a{" "}
          <span className="font-medium">{groupMembership.group.name}</span>.
        </p>

        <TeachersListClient
          initialTeachers={teachers}
          groupId={groupId}
          title="Lista de professores do grupo"
        />
      </div>
    </main>
  );
}
