import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureClassAccess(userId: string, classId: string) {
  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
      students: {
        orderBy: { name: "asc" },
      },
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

export async function GET(
  _req: NextRequest,
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

  const attendances = await prisma.attendance.findMany({
    where: { classId },
    include: {
      presences: {
        select: {
          id: true,
          present: true,
        },
      },
    },
    orderBy: [{ lessonDate: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(attendances);
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
  const title = String(data.title ?? "").trim();
  const lessonDateRaw = String(data.lessonDate ?? "").trim();
  const presencesInput = Array.isArray(data.presences) ? data.presences : [];

  if (!title) {
    return NextResponse.json(
      { error: "Missing attendance title" },
      { status: 400 }
    );
  }

  if (!lessonDateRaw) {
    return NextResponse.json(
      { error: "Missing attendance date" },
      { status: 400 }
    );
  }

  const lessonDate = new Date(`${lessonDateRaw}T12:00:00`);

  if (Number.isNaN(lessonDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid attendance date" },
      { status: 400 }
    );
  }

  const presentByStudentId = new Map<string, boolean>();
  for (const item of presencesInput) {
    const studentId = String(item?.studentId ?? "");
    if (!studentId) continue;
    presentByStudentId.set(studentId, Boolean(item?.present));
  }

  const activeStudents = foundClass.students.filter(
    (student) => !student.deletedAt
  );

  const attendance = await prisma.attendance.create({
    data: {
      title,
      classId,
      lessonDate,
      presences: {
        create: activeStudents.map((student) => ({
          studentId: student.id,
          present: presentByStudentId.get(student.id) ?? false,
        })),
      },
    },
    include: {
      presences: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          student: {
            name: "asc",
          },
        },
      },
    },
  });

  return NextResponse.json(attendance, { status: 201 });
}
