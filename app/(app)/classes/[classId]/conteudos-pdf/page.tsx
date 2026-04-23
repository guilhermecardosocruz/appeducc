import { notFound } from "next/navigation";
import ClassContentsPdfSelectorClient from "@/components/ClassContentsPdfSelectorClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessClass } from "@/lib/permissions";

type PageProps = {
  params: Promise<{ classId: string }>;
};

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

export default async function ClassConteudosPdfPage({ params }: PageProps) {
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

  // 🔥 CORREÇÃO PRINCIPAL
  const hasAccess = await canAccessClass(user.id, classId);

  if (!hasAccess) {
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

  const canManageClass =
    Boolean(schoolMembership) ||
    Boolean(groupMembership && canManageGroupRole(groupMembership.role)) ||
    isTeacherOfClass;

  const contents = foundClass.contents.map((content) => ({
    id: content.id,
    title: content.title,
  }));

  return (
    <ClassContentsPdfSelectorClient
      classId={classId}
      contents={contents}
    />
  );
}
