import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

async function ensureClassAccess(userId: string, classId: string) {
  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
    },
  });

  if (!foundClass) return null;

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId,
          schoolId: foundClass.schoolId,
        },
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: foundClass.school.groupId,
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
    foundClass,
    canManage,
  };
}

function parseStartDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseEndDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

type Params = {
  params: Promise<{ classId: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId } = await params;
  const access = await ensureClassAccess(user.id, classId);

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const startDate = parseStartDate(url.searchParams.get("startDate"));
  const endDate = parseEndDate(url.searchParams.get("endDate"));

  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      students: {
        where: {
          status: "ACTIVE",
          deletedAt: null,
        },
        orderBy: { name: "asc" },
      },
      attendances: {
        include: {
          presences: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  deletedAt: true,
                },
              },
            },
          },
        },
        orderBy: [{ lessonDate: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!foundClass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const activeStudents = foundClass.students;

  const studentMap = new Map(
    activeStudents.map((student) => [
      student.id,
      {
        studentId: student.id,
        name: student.name,
        presences: 0,
        absences: 0,
        presenceRate: 0,
      },
    ])
  );

  let totalPresences = 0;
  let totalAbsences = 0;
  let totalAttendances = 0;

  for (const attendance of foundClass.attendances) {
    const lessonDate = new Date(attendance.lessonDate);

    if (startDate && lessonDate < startDate) {
      continue;
    }

    if (endDate && lessonDate > endDate) {
      continue;
    }

    totalAttendances += 1;

    for (const presence of attendance.presences) {
      if (!presence.student) continue;
      if (presence.student.deletedAt || presence.student.status !== "ACTIVE") {
        continue;
      }

      const current = studentMap.get(presence.studentId);
      if (!current) continue;

      if (presence.present) {
        current.presences += 1;
        totalPresences += 1;
      } else {
        current.absences += 1;
        totalAbsences += 1;
      }
    }
  }

  const students = Array.from(studentMap.values())
    .map((student) => {
      const total = student.presences + student.absences;
      const presenceRate = total > 0 ? (student.presences / total) * 100 : 0;

      return {
        ...student,
        presenceRate: Number(presenceRate.toFixed(2)),
      };
    })
    .sort((a, b) => {
      if (b.presenceRate !== a.presenceRate) {
        return b.presenceRate - a.presenceRate;
      }
      return a.name.localeCompare(b.name, "pt-BR");
    });

  const totalRecords = totalPresences + totalAbsences;
  const classPresenceRate =
    totalRecords > 0 ? (totalPresences / totalRecords) * 100 : 0;
  const avgPresencesPerAttendance =
    totalAttendances > 0 ? totalPresences / totalAttendances : 0;
  const avgAbsencesPerAttendance =
    totalAttendances > 0 ? totalAbsences / totalAttendances : 0;

  return NextResponse.json({
    summary: {
      classId: foundClass.id,
      className: foundClass.name,
      totalStudents: activeStudents.length,
      totalAttendances,
      totalPresences,
      totalAbsences,
      presenceRate: Number(classPresenceRate.toFixed(2)),
      avgPresencesPerAttendance: Number(avgPresencesPerAttendance.toFixed(2)),
      avgAbsencesPerAttendance: Number(avgAbsencesPerAttendance.toFixed(2)),
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
    },
    students,
  });
}
