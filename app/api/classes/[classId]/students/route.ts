import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isManagerRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return ["OWNER", "MANAGER"].includes(normalized);
}

async function ensureClassAccess(userId: string, classId: string) {
  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
    },
  });

  if (!foundClass) return null;

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId,
          schoolId: foundClass.schoolId,
        },
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: foundClass.school.groupId,
        },
      },
    }),
  ]);

  const isTeacherOfClass = foundClass.teacherId === userId;

  const hasAccess =
    Boolean(schoolMembership) || Boolean(groupMembership) || isTeacherOfClass;

  const canManage =
    Boolean(schoolMembership) ||
    Boolean(groupMembership && isManagerRole(groupMembership.role)) ||
    isTeacherOfClass;

  if (!hasAccess) return null;

  return { foundClass, canManage };
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
  const access = await ensureClassAccess(user.id, classId);

  if (!access || !access.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const name = String(data.name ?? "").trim();
  const attendanceId = String(data.attendanceId ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const existingStudent = await prisma.student.findFirst({
    where: { classId, name },
  });

  if (existingStudent) {
    return NextResponse.json(
      { error: "Student already exists" },
      { status: 409 }
    );
  }

  const createdStudent = await prisma.student.create({
    data: {
      name,
      classId,
      status: "PENDING_ENTRY",
    },
  });

  let createdPresence = null;

  if (attendanceId) {
    createdPresence = await prisma.attendancePresence.create({
      data: {
        attendanceId,
        studentId: createdStudent.id,
        present: true,
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
