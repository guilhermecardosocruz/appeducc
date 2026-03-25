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
    where: {
      groupId,
    },
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
      },
    },
    orderBy: { name: "asc" },
  });

  let groupStudents = 0;
  let groupPresences = 0;
  let groupAbsences = 0;
  let groupClasses = 0;
  let groupAttendances = 0;

  const schoolReports = schools.map((school) => {
    let totalStudents = 0;
    let totalPresences = 0;
    let totalAbsences = 0;
    let totalAttendances = 0;

    school.classes.forEach((cls) => {
      totalStudents += cls.students.length;
      groupClasses += 1;

      cls.attendances.forEach((attendance) => {
        const lessonDate = new Date(attendance.lessonDate);

        if (startDate && lessonDate < startDate) return;
        if (endDate && lessonDate > endDate) return;

        totalAttendances += 1;
        groupAttendances += 1;

        attendance.presences.forEach((presence) => {
          if (
            presence.student?.deletedAt ||
            presence.student?.status !== "ACTIVE"
          ) {
            return;
          }

          if (presence.present) {
            totalPresences += 1;
            groupPresences += 1;
          } else {
            totalAbsences += 1;
            groupAbsences += 1;
          }
        });
      });
    });

    groupStudents += totalStudents;

    const total = totalPresences + totalAbsences;
    const presenceRate = total > 0 ? (totalPresences / total) * 100 : 0;
    const avgPresencesPerAttendance =
      totalAttendances > 0 ? totalPresences / totalAttendances : 0;
    const avgAbsencesPerAttendance =
      totalAttendances > 0 ? totalAbsences / totalAttendances : 0;

    return {
      schoolId: school.id,
      schoolName: school.name,
      classes: school.classes.length,
      students: totalStudents,
      totalAttendances,
      presences: totalPresences,
      absences: totalAbsences,
      presenceRate: Number(presenceRate.toFixed(2)),
      avgPresencesPerAttendance: Number(avgPresencesPerAttendance.toFixed(2)),
      avgAbsencesPerAttendance: Number(avgAbsencesPerAttendance.toFixed(2)),
    };
  });

  const totalGroup = groupPresences + groupAbsences;
  const groupPresenceRate =
    totalGroup > 0 ? (groupPresences / totalGroup) * 100 : 0;
  const groupAvgPresencesPerAttendance =
    groupAttendances > 0 ? groupPresences / groupAttendances : 0;
  const groupAvgAbsencesPerAttendance =
    groupAttendances > 0 ? groupAbsences / groupAttendances : 0;

  return NextResponse.json({
    summary: {
      schools: schools.length,
      classes: groupClasses,
      students: groupStudents,
      totalAttendances: groupAttendances,
      presences: groupPresences,
      absences: groupAbsences,
      presenceRate: Number(groupPresenceRate.toFixed(2)),
      avgPresencesPerAttendance: Number(
        groupAvgPresencesPerAttendance.toFixed(2)
      ),
      avgAbsencesPerAttendance: Number(
        groupAvgAbsencesPerAttendance.toFixed(2)
      ),
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
    },
    schools: schoolReports.sort((a, b) => b.presenceRate - a.presenceRate),
  });
}
