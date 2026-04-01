import Link from "next/link";
import { notFound } from "next/navigation";
import ClassContentsClient from "@/components/ClassContentsClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ classId: string }>;
};

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

export default async function ClassConteudosPage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { classId } = await params;

  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
      contents: {
        orderBy: { createdAt: "asc" },
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

  const isTeacherOfClass = foundClass.teacherId === user.id;
  const hasAccess =
    Boolean(schoolMembership) || Boolean(groupMembership) || isTeacherOfClass;

  if (!hasAccess) {
    notFound();
  }

  const canManageClass =
    Boolean(schoolMembership) ||
    Boolean(groupMembership && canManageGroupRole(groupMembership.role)) ||
    isTeacherOfClass;

  const initialContents = foundClass.contents.map((content) => ({
    id: content.id,
    title: content.title,
    objectives: content.objectives,
    methodology: content.methodology,
    resources: content.resources,
    bncc: content.bncc,
    createdAt: content.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href={`/classes/${classId}`}
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          ← Voltar para turma
        </Link>

        <ClassContentsClient
          classId={classId}
          initialContents={initialContents}
          canManageClass={canManageClass}
        />
      </div>
    </main>
  );
}
