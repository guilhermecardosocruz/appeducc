import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const membership = await prisma.schoolMember.findUnique({
    where: {
      userId_schoolId: {
        userId,
        schoolId: attendance.class.schoolId,
      },
    },
  });

  if (!membership) return null;

  return attendance;
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
  const attendance = await ensureAttendanceAccess(user.id, attendanceId);

  if (!attendance) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(attendance);
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
  const attendance = await ensureAttendanceAccess(user.id, attendanceId);

  if (!attendance) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const title = String(data.title ?? "").trim();
  const presences = Array.isArray(data.presences) ? data.presences : [];

  if (!title) {
    return NextResponse.json(
      { error: "Missing attendance title" },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.attendance.update({
      where: { id: attendanceId },
      data: { title },
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

  return NextResponse.json(updated);
}
