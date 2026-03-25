import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SchoolReportsPdfClient from "@/components/SchoolReportsPdfClient";

type PageProps = {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
};

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

export default async function SchoolReportsPdfPage({
  params,
  searchParams,
}: PageProps) {
  const user = await getSessionUser();
  if (!user) notFound();

  const { schoolId } = await params;
  const { startDate = "", endDate = "" } = await searchParams;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      group: true,
    },
  });

  if (!school) notFound();

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId: user.id,
          schoolId,
        },
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: school.groupId,
        },
      },
    }),
  ]);

  const canAccess = Boolean(schoolMembership) || Boolean(groupMembership);

  if (!canAccess) notFound();

  const canViewReports = Boolean(
    groupMembership && canManageGroupRole(groupMembership.role)
  );

  if (!canViewReports) notFound();

  return (
    <SchoolReportsPdfClient
      schoolId={schoolId}
      startDate={startDate}
      endDate={endDate}
    />
  );
}
