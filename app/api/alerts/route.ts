import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type AlertStudent = {
  studentId: string;
  studentName: string;
  frequency: number;
};

type AlertItem = {
  classId: string;
  className: string;
  schoolName: string;
  students: AlertStudent[];
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const classes = await prisma.class.findMany({
    include: {
      school: true,
      students: {
        include: {
          presences: {
            include: {
              attendance: true,
            },
          },
        },
      },
    },
  });

  const alerts: AlertItem[] = [];

  for (const cls of classes) {
    const alertStudents: AlertStudent[] = [];

    for (const student of cls.students) {
      if (student.status !== "ACTIVE") continue;

      const records = student.presences
        .filter((p) => p.attendance?.lessonDate)
        .sort(
          (a, b) =>
            new Date(b.attendance.lessonDate).getTime() -
            new Date(a.attendance.lessonDate).getTime()
        );

      if (records.length < 2) continue;

      const last = records[0];
      const previous = records[1];

      if (!last.present && !previous.present) {
        // calcular frequência
        const total = records.length;
        const presentCount = records.filter((r) => r.present).length;
        const frequency =
          total > 0 ? Math.round((presentCount / total) * 100) : 0;

        alertStudents.push({
          studentId: student.id,
          studentName: student.name,
          frequency,
        });
      }
    }

    if (alertStudents.length > 0) {
      alerts.push({
        classId: cls.id,
        className: cls.name,
        schoolName: cls.school.name,
        students: alertStudents,
      });
    }
  }

  return NextResponse.json(alerts);
}
