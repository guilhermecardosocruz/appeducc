import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ schoolId: string; classId: string }>;
};

export async function PATCH(req: NextRequest, { params }: Params) {
  const { classId } = await params;
  const data = await req.json();

  await prisma.classSchedule.deleteMany({
    where: { classId },
  });

  if (data.schedule) {
    await prisma.classSchedule.create({
      data: {
        classId,
        dayOfWeek: data.schedule.dayOfWeek,
        period: data.schedule.period,
        startTime: data.schedule.startTime,
        endTime: data.schedule.endTime,
      },
    });
  }

  const updated = await prisma.class.update({
    where: { id: classId },
    data: {
      name: data.name,
      year: data.year,
      teacherId: data.teacherId,
    },
  });

  return NextResponse.json(updated);
}
