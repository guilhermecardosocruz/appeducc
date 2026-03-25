import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type Params = {
  params: Promise<{ schoolId: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { schoolId } = await params;

  const classes = await prisma.class.findMany({
    where: { schoolId },
    include: {
      students: true,
      attendances: {
        include: {
          presences: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  let schoolStudents = 0;
  let schoolPresences = 0;
  let schoolAbsences = 0;

  const classReports = classes.map((cls) => {
    const totalStudents = cls.students.length;
    let totalPresences = 0;
    let totalAbsences = 0;

    cls.attendances.forEach((attendance) => {
      attendance.presences.forEach((presence) => {
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

    return {
      classId: cls.id,
      className: cls.name,
      students: totalStudents,
      presences: totalPresences,
      absences: totalAbsences,
      presenceRate: Number(presenceRate.toFixed(2)),
    };
  });

  const totalSchool = schoolPresences + schoolAbsences;
  const schoolPresenceRate =
    totalSchool > 0 ? (schoolPresences / totalSchool) * 100 : 0;

  return NextResponse.json({
    summary: {
      classes: classes.length,
      students: schoolStudents,
      presences: schoolPresences,
      absences: schoolAbsences,
      presenceRate: Number(schoolPresenceRate.toFixed(2)),
    },
    classes: classReports.sort((a, b) => b.presenceRate - a.presenceRate),
  });
}
