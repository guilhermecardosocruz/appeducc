import { notFound } from "next/navigation";
import ClassAttendanceReportPdfClient from "@/components/ClassAttendanceReportPdfClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
};

export default async function ClassRelatorioChamadasPdfPage({
  params,
  searchParams,
}: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { classId } = await params;
  const { startDate = "", endDate = "" } = await searchParams;

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

  const hasAccess = Boolean(schoolMembership) || Boolean(groupMembership);

  if (!hasAccess) {
    notFound();
  }

  return (
    <ClassAttendanceReportPdfClient
      classId={classId}
      startDate={startDate}
      endDate={endDate}
    />
  );
}
