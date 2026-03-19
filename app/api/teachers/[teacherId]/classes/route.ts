import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getTeacherOwnedByUser(userId: string, teacherId: string) {
  return prisma.user.findFirst({
    where: {
      id: teacherId,
      createdById: userId,
      isTeacher: true,
    },
  });
}

async function getTeacherClassesPayload(userId: string, teacherId: string) {
  const linkedClassesRaw = await prisma.class.findMany({
    where: {
      teacherId,
    },
    include: {
      school: {
        include: {
          group: true,
        },
      },
    },
    orderBy: [{ school: { name: "asc" } }, { name: "asc" }],
  });

  const availableClassesRaw = await prisma.class.findMany({
    where: {
      teacherId: null,
      school: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    include: {
      school: {
        include: {
          group: true,
        },
      },
    },
    orderBy: [{ school: { name: "asc" } }, { name: "asc" }],
  });

  return {
    linkedClasses: linkedClassesRaw.map((item) => ({
      id: item.id,
      name: item.name,
      year: item.year,
      school: {
        id: item.school.id,
        name: item.school.name,
        group: {
          id: item.school.group.id,
          name: item.school.group.name,
        },
      },
    })),
    availableClasses: availableClassesRaw.map((item) => ({
      id: item.id,
      name: item.name,
      year: item.year,
      school: {
        id: item.school.id,
        name: item.school.name,
        group: {
          id: item.school.group.id,
          name: item.school.group.name,
        },
      },
    })),
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teacherId } = await params;
  const teacher = await getTeacherOwnedByUser(user.id, teacherId);

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const data = await req.json();
  const classId = String(data.classId ?? "").trim();

  if (!classId) {
    return NextResponse.json({ error: "Missing classId" }, { status: 400 });
  }

  const targetClass = await prisma.class.findFirst({
    where: {
      id: classId,
      school: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    },
    include: {
      school: {
        include: {
          group: true,
        },
      },
    },
  });

  if (!targetClass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.class.update({
      where: { id: classId },
      data: {
        teacherId: teacher.id,
      },
    });

    await tx.schoolMember.upsert({
      where: {
        userId_schoolId: {
          userId: teacher.id,
          schoolId: targetClass.schoolId,
        },
      },
      update: {
        role: "TEACHER",
      },
      create: {
        userId: teacher.id,
        schoolId: targetClass.schoolId,
        role: "TEACHER",
      },
    });

    await tx.groupMember.upsert({
      where: {
        userId_groupId: {
          userId: teacher.id,
          groupId: targetClass.school.groupId,
        },
      },
      update: {
        role: "VIEWER",
      },
      create: {
        userId: teacher.id,
        groupId: targetClass.school.groupId,
        role: "VIEWER",
      },
    });
  });

  const payload = await getTeacherClassesPayload(user.id, teacher.id);
  return NextResponse.json(payload);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teacherId } = await params;
  const teacher = await getTeacherOwnedByUser(user.id, teacherId);

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const data = await req.json();
  const classId = String(data.classId ?? "").trim();

  if (!classId) {
    return NextResponse.json({ error: "Missing classId" }, { status: 400 });
  }

  const targetClass = await prisma.class.findFirst({
    where: {
      id: classId,
      teacherId: teacher.id,
    },
    include: {
      school: {
        include: {
          group: true,
          classes: {
            where: {
              teacherId: teacher.id,
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!targetClass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.class.update({
      where: { id: classId },
      data: {
        teacherId: null,
      },
    });

    const remainingTeacherClassesInSchool = await tx.class.count({
      where: {
        teacherId: teacher.id,
        schoolId: targetClass.schoolId,
      },
    });

    if (remainingTeacherClassesInSchool === 0) {
      await tx.schoolMember.deleteMany({
        where: {
          userId: teacher.id,
          schoolId: targetClass.schoolId,
          role: "TEACHER",
        },
      });
    }

    const remainingTeacherClassesInGroup = await tx.class.count({
      where: {
        teacherId: teacher.id,
        school: {
          groupId: targetClass.school.groupId,
        },
      },
    });

    if (remainingTeacherClassesInGroup === 0) {
      await tx.groupMember.deleteMany({
        where: {
          userId: teacher.id,
          groupId: targetClass.school.groupId,
          role: "VIEWER",
        },
      });
    }
  });

  const payload = await getTeacherClassesPayload(user.id, teacher.id);
  return NextResponse.json(payload);
}
