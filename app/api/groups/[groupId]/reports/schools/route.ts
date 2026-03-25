import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type Params = {
  params: Promise<{ groupId: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { groupId } = await params;

  const schools = await prisma.school.findMany({
    where: {
      groupId,
    },
    include: {
      classes: {
        include: {
          students: true,
          attendances: {
            include: {
              presences: true,
            },
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

  const schoolReports = schools.map((school) => {
    let totalStudents = 0;
    let totalPresences = 0;
    let totalAbsences = 0;

    school.classes.forEach((cls) => {
      totalStudents += cls.students.length;
      groupClasses++;

      cls.attendances.forEach((attendance) => {
        attendance.presences.forEach((presence) => {
          if (presence.present) {
            totalPresences++;
            groupPresences++;
          } else {
            totalAbsences++;
            groupAbsences++;
          }
        });
      });
    });

    groupStudents += totalStudents;

    const total = totalPresences + totalAbsences;
    const presenceRate = total > 0 ? (totalPresences / total) * 100 : 0;

    return {
      schoolId: school.id,
      schoolName: school.name,
      classes: school.classes.length,
      students: totalStudents,
      presences: totalPresences,
      absences: totalAbsences,
      presenceRate: Number(presenceRate.toFixed(2)),
    };
  });

  const totalGroup = groupPresences + groupAbsences;
  const groupPresenceRate =
    totalGroup > 0 ? (groupPresences / totalGroup) * 100 : 0;

  return NextResponse.json({
    summary: {
      schools: schools.length,
      classes: groupClasses,
      students: groupStudents,
      presences: groupPresences,
      absences: groupAbsences,
      presenceRate: Number(groupPresenceRate.toFixed(2)),
    },
    schools: schoolReports.sort((a, b) => b.presenceRate - a.presenceRate),
  });
}
