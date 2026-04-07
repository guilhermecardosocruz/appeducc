import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

async function ensureClassAccess(userId: string, classId: string) {
  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
      students: {
        orderBy: { name: "asc" },
      },
      contents: {
        select: {
          id: true,
        },
      },
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
    Boolean(groupMembership && canManageGroupRole(groupMembership.role)) ||
    isTeacherOfClass;

  if (!hasAccess) return null;

  return {
    foundClass,
    canManage,
  };
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
  const access = await ensureClassAccess(user.id, classId);

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attendances = await prisma.attendance.findMany({
    where: { classId },
    include: {
      content: {
        select: {
          id: true,
          title: true,
        },
      },
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
  const access = await ensureClassAccess(user.id, classId);

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!access.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { foundClass } = access;

  const data = await req.json();
  const title = String(data.title ?? "").trim();
  const lessonDateRaw = String(data.lessonDate ?? "").trim();
  const contentIdRaw = data.contentId == null ? null : String(data.contentId).trim();
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

  let contentId: string | null = null;

  if (contentIdRaw) {
    const contentBelongsToClass = foundClass.contents.some(
      (content) => content.id === contentIdRaw
    );

    if (!contentBelongsToClass) {
      return NextResponse.json(
        { error: "Invalid content for this class" },
        { status: 400 }
      );
    }

    contentId = contentIdRaw;
  }

  const presentByStudentId = new Map<string, boolean>();
  for (const item of presencesInput) {
    const studentId = String(item?.studentId ?? "");
    if (!studentId) continue;
    presentByStudentId.set(studentId, Boolean(item?.present));
  }

  const activeStudents = foundClass.students.filter(
    (student) => student.status === "ACTIVE" && !student.deletedAt
  );

  const attendance = await prisma.attendance.create({
    data: {
      title,
      classId,
      lessonDate,
      contentId,
      presences: {
        create: activeStudents.map((student) => ({
          studentId: student.id,
          // 🔥 CORREÇÃO AQUI
          present: presentByStudentId.get(student.id) ?? false,
        })),
      },
    },
    include: {
      content: {
        select: {
          id: true,
          title: true,
        },
      },
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
