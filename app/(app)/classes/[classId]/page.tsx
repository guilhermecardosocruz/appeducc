import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClassDetailClient from "@/components/ClassDetailClient";

type PageProps = {
  params: Promise<{ classId: string }>;
};

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

export default async function ClassPage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { classId } = await params;

  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
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

  const hasAccess =
    Boolean(schoolMembership) ||
    Boolean(
      groupMembership &&
        (canManageGroupRole(groupMembership.role) ||
          groupMembership.canManageSchools)
    );

  if (!hasAccess) {
    notFound();
  }

  return (
    <ClassDetailClient
      classId={foundClass.id}
      className={foundClass.name}
      schoolId={foundClass.schoolId}
    />
  );
}
