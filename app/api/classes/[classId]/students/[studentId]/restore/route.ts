import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureClassAccess(userId: string, classId: string) {
  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
    },
  });

  if (!foundClass) return null;

  const membership = await prisma.schoolMember.findUnique({
    where: {
      userId_schoolId: {
        userId,
        schoolId: foundClass.schoolId,
      },
    },
  });

  if (!membership) return null;

  return foundClass;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string; studentId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId, studentId } = await params;

  const foundClass = await ensureClassAccess(user.id, classId);
  if (!foundClass) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student || student.classId !== classId) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  await prisma.student.update({
    where: { id: studentId },
    data: {
      status: "ACTIVE",
      deletedAt: null,
      deletedReason: null,
      deletedById: null,
    },
  });

  return NextResponse.json({ success: true });
}
