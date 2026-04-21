import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type Params = {
  params: Promise<{ groupId: string }>;
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

export async function GET(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { groupId } = await params;

  const url = new URL(req.url);
  const startDate = parseStartDate(url.searchParams.get("startDate"));
  const endDate = parseEndDate(url.searchParams.get("endDate"));

  const schools = await prisma.school.findMany({
    where: { groupId },
    include: {
      classes: {
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
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  let totalClasses = 0;
  let totalStudents = 0;
  let totalAttendances = 0;

  const schoolReports = schools.map((school) => {
    const classReports = school.classes.map((cls) => {
      const validStudentIds = new Set(
        cls.students.map((s) => s.id)
      );

      let presences = 0;
      let absences = 0;
      let attendancesCount = 0;

      cls.attendances.forEach((attendance) => {
        const lessonDate = new Date(attendance.lessonDate);

        if (startDate && lessonDate < startDate) return;
        if (endDate && lessonDate > endDate) return;

        attendancesCount += 1;

        attendance.presences.forEach((presence) => {
          if (!validStudentIds.has(presence.studentId)) return;

          if (presence.present) presences += 1;
          else absences += 1;
        });
      });

      const total = presences + absences;
      const presenceRate = total > 0 ? (presences / total) * 100 : 0;

      const avgPresences =
        attendancesCount > 0 ? presences / attendancesCount : 0;

      const avgAbsences =
        attendancesCount > 0 ? absences / attendancesCount : 0;

      totalClasses += 1;
      totalStudents += cls.students.length;
      totalAttendances += attendancesCount;

      return {
        classId: cls.id,
        className: cls.name,
        students: cls.students.length,
        totalAttendances: attendancesCount,
        presenceRate: Number(presenceRate.toFixed(2)),
        avgPresencesPerAttendance: Number(avgPresences.toFixed(2)),
        avgAbsencesPerAttendance: Number(avgAbsences.toFixed(2)),
      };
    });

    return {
      schoolId: school.id,
      schoolName: school.name,
      classes: classReports,
    };
  });

  return NextResponse.json({
    summary: {
      schools: schools.length,
      classes: totalClasses,
      students: totalStudents,
      totalAttendances,
    },
    schools: schoolReports,
  });
}
