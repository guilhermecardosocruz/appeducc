import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeRole(role: string | null | undefined) {
  return String(role ?? "").trim().toUpperCase();
}

function isGroupManagerRole(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return normalized === "OWNER" || normalized === "MANAGER";
}

type RouteProps = {
  params: Promise<{ groupId: string }>;
};

export async function GET(
  _req: NextRequest,
  { params }: RouteProps
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  const [groupMembership, schoolMembershipsInGroup, teacherClassesInGroup, group] =
    await Promise.all([
      prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: user.id,
            groupId,
          },
        },
      }),
      prisma.schoolMember.findMany({
        where: {
          userId: user.id,
          school: {
            groupId,
          },
        },
        select: {
          schoolId: true,
        },
      }),
      prisma.class.findMany({
        where: {
          teacherId: user.id,
          school: {
            groupId,
          },
        },
        select: {
          id: true,
          schoolId: true,
        },
      }),
      prisma.group.findUnique({
        where: { id: groupId },
        select: { id: true },
      }),
    ]);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const hasAccess =
    Boolean(groupMembership) ||
    schoolMembershipsInGroup.length > 0 ||
    teacherClassesInGroup.length > 0;

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isGroupManager = Boolean(
    groupMembership && isGroupManagerRole(groupMembership.role)
  );

  const allowedSchoolIds = new Set(
    schoolMembershipsInGroup.map((item) => item.schoolId)
  );

  const allowedTeacherClassIds = new Set(
    teacherClassesInGroup.map((item) => item.id)
  );

  const schedules = await prisma.classSchedule.findMany({
    where: {
      class: {
        school: {
          groupId,
        },
        ...(isGroupManager
          ? {}
          : user.isTeacher
            ? {
                teacherId: user.id,
              }
            : allowedSchoolIds.size > 0
              ? {
                  schoolId: {
                    in: Array.from(allowedSchoolIds),
                  },
                }
              : {
                  id: {
                    in: Array.from(allowedTeacherClassIds),
                  },
                }),
      },
    },
    include: {
      class: {
        include: {
          school: true,
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [
      { dayOfWeek: "asc" },
      { period: "asc" },
      { startTime: "asc" },
      { endTime: "asc" },
      { createdAt: "asc" },
    ],
  });

  return NextResponse.json(
    schedules.map((item) => ({
      id: item.id,
      dayOfWeek: item.dayOfWeek,
      period: item.period,
      startTime: item.startTime,
      endTime: item.endTime,
      classId: item.classId,
      className: item.class.name,
      schoolId: item.class.schoolId,
      schoolName: item.class.school.name,
      teacherId: item.class.teacher?.id ?? null,
      teacherName: item.class.teacher?.name ?? null,
    }))
  );
}
