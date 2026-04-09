import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type AlertItem = {
  id: string;
  classId: string;
  className: string;
  schoolName: string;
  studentId: string;
  studentName: string;
  frequency: number;
  isRead: boolean;
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const classes = await prisma.class.findMany({
    where: user.isTeacher ? { teacherId: user.id } : undefined,
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

  const seenRecords = await prisma.alertSeen.findMany({
    where: { userId: user.id },
  });

  const seenMap = new Map(
    seenRecords.map((r) => [
      `${r.classId}-${r.studentId}`,
      r,
    ])
  );

  const alerts: AlertItem[] = [];

  for (const cls of classes) {
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
        const total = records.length;
        const presentCount = records.filter((r) => r.present).length;
        const frequency =
          total > 0 ? Math.round((presentCount / total) * 100) : 0;

        const key = `${cls.id}-${student.id}`;
        const seen = seenMap.get(key);

        if (seen?.dismissedAt) continue;

        alerts.push({
          id: key,
          classId: cls.id,
          className: cls.name,
          schoolName: cls.school.name,
          studentId: student.id,
          studentName: student.name,
          frequency,
          isRead: !!seen?.seenAt,
        });
      }
    }
  }

  return NextResponse.json(alerts);
}
