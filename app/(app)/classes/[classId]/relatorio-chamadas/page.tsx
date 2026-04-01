import { notFound } from "next/navigation";
import ClassAttendanceReportClient from "@/components/ClassAttendanceReportClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ classId: string }>;
};

export default async function ClassRelatorioChamadasPage({
  params,
}: PageProps) {
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

  const isTeacherOfClass = foundClass.teacherId === user.id;
  const hasAccess =
    Boolean(schoolMembership) || Boolean(groupMembership) || isTeacherOfClass;

  if (!hasAccess) {
    notFound();
  }

  return <ClassAttendanceReportClient classId={classId} />;
}
