import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId, studentId } = await req.json();

  const existing = await prisma.alertSeen.findUnique({
    where: {
      userId_classId_studentId: {
        userId: user.id,
        classId,
        studentId,
      },
    },
  });

  // 🔥 TOGGLE
  if (existing?.seenAt) {
    await prisma.alertSeen.update({
      where: {
        userId_classId_studentId: {
          userId: user.id,
          classId,
          studentId,
        },
      },
      data: {
        seenAt: null,
      },
    });
  } else {
    await prisma.alertSeen.upsert({
      where: {
        userId_classId_studentId: {
          userId: user.id,
          classId,
          studentId,
        },
      },
      update: {
        seenAt: new Date(),
      },
      create: {
        userId: user.id,
        classId,
        studentId,
        seenAt: new Date(),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
