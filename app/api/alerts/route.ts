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

  // buscar turmas do usuário
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
    select: {
      id: true,
      name: true,
    },
  });

  const classIds = classes.map((c) => c.id);

  if (classIds.length === 0) {
    return NextResponse.json([]);
  }

  // buscar alunos
  const students = await prisma.student.findMany({
    where: {
      classId: { in: classIds },
      status: "ACTIVE",
    },
    include: {
      class: true,
      presences: {
        orderBy: {
          createdAt: "desc",
        },
        take: 2,
      },
    },
  });

  const alerts: AlertItem[] = [];

  for (const student of students) {
    if (student.presences.length < 2) continue;

    const [p1, p2] = student.presences;

    if (!p1.present && !p2.present) {
      alerts.push({
        type: "ABSENCE_STREAK",
        studentName: student.name,
        className: student.class.name,
        message: "2 faltas consecutivas",
        severity: "high",
      });
    }
  }

  return NextResponse.json(alerts);
}
