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
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId } = await params;
  const foundClass = await ensureClassAccess(user.id, classId);

  if (!foundClass) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const name = String(data.name ?? "").trim();
  const attendanceId = String(data.attendanceId ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Missing student name" }, { status: 400 });
  }

  const createdStudent = await prisma.student.create({
    data: {
      name,
      classId,
    },
  });

  let createdPresence = null;

  if (attendanceId) {
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendance || attendance.classId !== classId) {
      return NextResponse.json(
        { error: "Attendance not found for this class" },
        { status: 400 }
      );
    }

    createdPresence = await prisma.attendancePresence.create({
      data: {
        attendanceId,
        studentId: createdStudent.id,
        present: false,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  return NextResponse.json(
    {
      student: createdStudent,
      presence: createdPresence,
    },
    { status: 201 }
  );
}
