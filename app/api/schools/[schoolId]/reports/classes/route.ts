import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type Params = {
  params: Promise<{ schoolId: string }>;
};

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

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

export async function GET(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { schoolId } = await params;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      group: true,
    },
  });

  if (!school) {
    return NextResponse.json({ error: "Escola não encontrada" }, { status: 404 });
  }

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

  if (!canAccess) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const canViewReports = Boolean(
    groupMembership && canManageGroupRole(groupMembership.role)
  );

  if (!canViewReports) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const url = new URL(req.url);
  const startDate = parseStartDate(url.searchParams.get("startDate"));
  const endDate = parseEndDate(url.searchParams.get("endDate"));

  const classes = await prisma.class.findMany({
    where: { schoolId },
    include: {
      students: {
        where: {
          status: "ACTIVE",
          deletedAt: null,
        },
      },
      attendances: {
        include: {
          presences: {
            include: {
              student: {
                select: {
                  id: true,
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
    orderBy: { name: "asc" },
  });

  let schoolStudents = 0;
  let schoolPresences = 0;
  let schoolAbsences = 0;
  let schoolAttendances = 0;

  const classReports = classes.map((cls) => {
    const totalStudents = cls.students.length;
    let totalPresences = 0;
    let totalAbsences = 0;
    let totalAttendances = 0;

    cls.attendances.forEach((attendance) => {
      const lessonDate = new Date(attendance.lessonDate);

      if (startDate && lessonDate < startDate) return;
      if (endDate && lessonDate > endDate) return;

      totalAttendances += 1;
      schoolAttendances += 1;

      attendance.presences.forEach((presence) => {
        if (
          presence.student?.deletedAt ||
          presence.student?.status !== "ACTIVE"
        ) {
          return;
        }

        if (presence.present) {
          totalPresences++;
          schoolPresences++;
        } else {
          totalAbsences++;
          schoolAbsences++;
        }
      });
    });

    schoolStudents += totalStudents;

    const total = totalPresences + totalAbsences;
    const presenceRate = total > 0 ? (totalPresences / total) * 100 : 0;
    const avgPresences =
      totalAttendances > 0 ? totalPresences / totalAttendances : 0;
    const avgAbsences =
      totalAttendances > 0 ? totalAbsences / totalAttendances : 0;

    return {
      classId: cls.id,
      className: cls.name,
      students: totalStudents,
      totalAttendances,
      presences: totalPresences,
      absences: totalAbsences,
      presenceRate: Number(presenceRate.toFixed(2)),
      avgPresencesPerAttendance: Number(avgPresences.toFixed(2)),
      avgAbsencesPerAttendance: Number(avgAbsences.toFixed(2)),
    };
  });

  const totalSchool = schoolPresences + schoolAbsences;
  const schoolPresenceRate =
    totalSchool > 0 ? (schoolPresences / totalSchool) * 100 : 0;
  const schoolAvgPresences =
    schoolAttendances > 0 ? schoolPresences / schoolAttendances : 0;
  const schoolAvgAbsences =
    schoolAttendances > 0 ? schoolAbsences / schoolAttendances : 0;

  return NextResponse.json({
    summary: {
      classes: classes.length,
      students: schoolStudents,
      totalAttendances: schoolAttendances,
      presences: schoolPresences,
      absences: schoolAbsences,
      presenceRate: Number(schoolPresenceRate.toFixed(2)),
      avgPresencesPerAttendance: Number(schoolAvgPresences.toFixed(2)),
      avgAbsencesPerAttendance: Number(schoolAvgAbsences.toFixed(2)),
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
    },
    classes: classReports.sort((a, b) => b.presenceRate - a.presenceRate),
  });
}
