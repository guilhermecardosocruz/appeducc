import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type AlertItem = {
  type: "ABSENCE_STREAK";
  studentName: string;
  className: string;
  message: string;
  severity: "high" | "medium" | "low";
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const classes = await prisma.class.findMany({
    where: {
      OR: [
        { teacherId: user.id },
        {
          school: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      ],
    },
    include: {
      attendances: {
        include: {
          presences: {
            include: {
              student: true,
            },
          },
        },
      },
    },
  });

  const alerts: AlertItem[] = [];

  for (const cls of classes) {
    // map aluno -> presenças
    const studentMap = new Map<
      string,
      {
        name: string;
        records: { present: boolean; date: Date }[];
      }
    >();

    for (const attendance of cls.attendances) {
      for (const presence of attendance.presences) {
        if (!presence.student) continue;
        if (presence.student.status !== "ACTIVE") continue;

        if (!studentMap.has(presence.studentId)) {
          studentMap.set(presence.studentId, {
            name: presence.student.name,
            records: [],
          });
        }

        studentMap.get(presence.studentId)!.records.push({
          present: presence.present,
          date: attendance.lessonDate,
        });
      }
    }

    // agora sim: análise por aluno
    for (const [, student] of studentMap) {
      const sorted = student.records.sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );

      if (sorted.length < 2) continue;

      const last = sorted[0];
      const previous = sorted[1];

      if (!last.present && !previous.present) {
        alerts.push({
          type: "ABSENCE_STREAK",
          studentName: student.name,
          className: cls.name,
          message: "2 faltas consecutivas",
          severity: "high",
        });
      }
    }
  }

  return NextResponse.json(alerts);
}
