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

  // 🔥 pega todas as turmas via schoolMember (garantido)
  const schoolMembers = await prisma.schoolMember.findMany({
    where: { userId: user.id },
    include: {
      school: {
        include: {
          classes: {
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
          },
        },
      },
    },
  });

  const alerts: AlertItem[] = [];

  for (const sm of schoolMembers) {
    for (const cls of sm.school.classes) {
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
  }

  return NextResponse.json(alerts);
}
