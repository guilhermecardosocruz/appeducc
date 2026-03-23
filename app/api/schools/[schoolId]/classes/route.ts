import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

async function getSchoolAccess(userId: string, schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      group: true,
    },
  });

  if (!school) return null;

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId,
          schoolId,
        },
      },
      include: {
        school: true,
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: school.groupId,
        },
      },
    }),
  ]);

  const hasAccess = Boolean(schoolMembership) || Boolean(groupMembership);
  const canManage =
    Boolean(schoolMembership) ||
    Boolean(groupMembership && canManageGroupRole(groupMembership.role));

  return {
    school,
    schoolMembership,
    groupMembership,
    hasAccess,
    canManage,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { schoolId } = await params;
  const access = await getSchoolAccess(user.id, schoolId);

  if (!access?.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const classes = await prisma.class.findMany({
    where: { schoolId },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: { students: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(classes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { schoolId } = await params;
  const access = await getSchoolAccess(user.id, schoolId);

  if (!access?.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const name = String(data.name ?? "").trim();
  const yearRaw = data.year;
  const teacherIdRaw = String(data.teacherId ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Missing class name" }, { status: 400 });
  }

  const year =
    typeof yearRaw === "number" && Number.isFinite(yearRaw) ? yearRaw : null;

  let teacherId: string | null = null;

  if (teacherIdRaw) {
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherIdRaw,
        isTeacher: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Invalid teacher for this school" },
        { status: 400 }
      );
    }

    teacherId = teacher.id;
  }

  const createdClass = await prisma.class.create({
    data: {
      name,
      year,
      schoolId,
      teacherId,
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: { students: true },
      },
    },
  });

  return NextResponse.json(createdClass, { status: 201 });
}
