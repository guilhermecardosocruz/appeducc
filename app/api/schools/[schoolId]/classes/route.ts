import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

async function getSchoolAccess(userId: string, schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { group: true },
  });

  if (!school) return null;

  const [schoolMembership, groupMembership, teacherClassInSchool] =
    await Promise.all([
      prisma.schoolMember.findUnique({
        where: {
          userId_schoolId: { userId, schoolId },
        },
      }),
      prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId: school.groupId,
          },
        },
      }),
      prisma.class.findFirst({
        where: {
          schoolId,
          teacherId: userId,
        },
      }),
    ]);

  const hasAccess =
    Boolean(schoolMembership) ||
    Boolean(groupMembership) ||
    Boolean(teacherClassInSchool);

  const canManage =
    Boolean(schoolMembership) ||
    Boolean(groupMembership && canManageGroupRole(groupMembership.role));

  return { hasAccess, canManage };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { schoolId } = await params;
  const access = await getSchoolAccess(user.id, schoolId);

  if (!access?.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();

  const createdClass = await prisma.class.create({
    data: {
      name: data.name,
      year: data.year,
      schoolId,
      teacherId: data.teacherId,
      schedules: data.schedule
        ? {
            create: {
              dayOfWeek: data.schedule.dayOfWeek,
              period: data.schedule.period,
              startTime: data.schedule.startTime,
              endTime: data.schedule.endTime,
            },
          }
        : undefined,
    },
  });

  return NextResponse.json(createdClass, { status: 201 });
}
