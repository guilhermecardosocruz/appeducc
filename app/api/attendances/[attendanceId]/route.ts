import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

async function ensureAttendanceAccess(userId: string, attendanceId: string) {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: {
      class: {
        include: {
          school: true,
        },
      },
      presences: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              deletedAt: true,
              status: true,
            },
          },
        },
        orderBy: {
          student: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!attendance) return null;

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId,
          schoolId: attendance.class.schoolId,
        },
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: attendance.class.school.groupId,
        },
      },
    }),
  ]);

  const hasAccess = Boolean(schoolMembership) || Boolean(groupMembership);
  const canManage =
    Boolean(schoolMembership) ||
    Boolean(groupMembership && canManageGroupRole(groupMembership.role));

  if (!hasAccess) return null;

  return {
    attendance,
    canManage,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { attendanceId } = await params;
  const access = await ensureAttendanceAccess(user.id, attendanceId);

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  access.attendance.presences = access.attendance.presences.filter(
    (p) => !p.student.deletedAt && p.student.status === "ACTIVE"
  );

  return NextResponse.json(access.attendance);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { attendanceId } = await params;
  const access = await ensureAttendanceAccess(user.id, attendanceId);

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!access.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const title = String(data.title ?? "").trim();
  const lessonDateRaw = String(data.lessonDate ?? "").trim();
  const presences = Array.isArray(data.presences) ? data.presences : [];

  if (!title) {
    return NextResponse.json(
      { error: "Missing attendance title" },
      { status: 400 }
    );
  }

  if (!lessonDateRaw) {
    return NextResponse.json(
      { error: "Missing attendance date" },
      { status: 400 }
    );
  }

  const lessonDate = new Date(`${lessonDateRaw}T12:00:00`);

  if (Number.isNaN(lessonDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid attendance date" },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        title,
        lessonDate,
      },
    }),
    ...presences.map((presence: { id: string; present: boolean }) =>
      prisma.attendancePresence.update({
        where: { id: presence.id },
        data: { present: Boolean(presence.present) },
      })
    ),
  ]);

  const updated = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: {
      class: {
        include: {
          school: true,
        },
      },
      presences: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              deletedAt: true,
              status: true,
            },
          },
        },
        orderBy: {
          student: {
            name: "asc",
          },
        },
      },
    },
  });

  if (updated) {
    updated.presences = updated.presences.filter(
      (p) => !p.student.deletedAt && p.student.status === "ACTIVE"
    );
  }

  return NextResponse.json(updated);
}
