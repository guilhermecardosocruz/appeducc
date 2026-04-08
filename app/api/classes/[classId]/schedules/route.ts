import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{ classId: string }>;
};

export async function GET(
  _req: NextRequest,
  { params }: RouteProps
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId } = await params;

  const classItem = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
      teacher: true,
    },
  });

  if (!classItem) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const schedules = await prisma.classSchedule.findMany({
    where: {
      classId,
    },
    orderBy: [
      { dayOfWeek: "asc" },
      { period: "asc" },
      { startTime: "asc" },
      { endTime: "asc" },
    ],
  });

  return NextResponse.json(
    schedules.map((item) => ({
      id: item.id,
      dayOfWeek: item.dayOfWeek,
      period: item.period,
      startTime: item.startTime,
      endTime: item.endTime,
      schoolName: classItem.school.name,
      teacherName: classItem.teacher?.name ?? null,
    }))
  );
}
