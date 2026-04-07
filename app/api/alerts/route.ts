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
        orderBy: {
          lessonDate: "desc",
        },
      },
    },
  });

  const alerts: AlertItem[] = [];

  for (const cls of classes) {
    const attendances = cls.attendances;

    // map de aluno → últimas presenças
    const studentMap = new Map<
      string,
      {
        name: string;
        last: boolean[];
      }
    >();

    for (const attendance of attendances) {
      for (const presence of attendance.presences) {
        if (!presence.student) continue;
        if (presence.student.status !== "ACTIVE") continue;

        const current = studentMap.get(presence.studentId);

        if (!current) {
          studentMap.set(presence.studentId, {
            name: presence.student.name,
            last: [presence.present],
          });
        } else {
          if (current.last.length < 2) {
            current.last.push(presence.present);
          }
        }
      }
    }

    for (const [, student] of studentMap) {
      if (student.last.length < 2) continue;

      const [last, previous] = student.last;

      if (!last && !previous) {
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
