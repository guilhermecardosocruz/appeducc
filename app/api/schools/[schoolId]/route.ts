import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ schoolId: string }>;
};

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

function canManageSchoolMembership(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized !== "" && normalized !== "TEACHER";
}

export async function GET(_req: Request, { params }: Params) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { schoolId } = await params;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [classes, students, attendances] = await Promise.all([
    prisma.class.count({ where: { schoolId } }),
    prisma.student.count({
      where: {
        class: {
          schoolId,
        },
      },
    }),
    prisma.attendance.count({
      where: {
        class: {
          schoolId,
        },
      },
    }),
  ]);

  return NextResponse.json({
    classes,
    students,
    attendances,
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { schoolId } = await params;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId: user.id,
          schoolId,
        },
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: school.groupId,
        },
      },
    }),
  ]);

  const canManageSchool =
    Boolean(
      schoolMembership && canManageSchoolMembership(schoolMembership.role)
    ) ||
    Boolean(groupMembership && canManageGroupRole(groupMembership.role));

  if (!canManageSchool) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const classes = await tx.class.findMany({
        where: { schoolId },
        select: { id: true },
      });

      const classIds = classes.map((c) => c.id);

      if (classIds.length > 0) {
        const attendances = await tx.attendance.findMany({
          where: { classId: { in: classIds } },
          select: { id: true },
        });

        const attendanceIds = attendances.map((a) => a.id);

        if (attendanceIds.length > 0) {
          await tx.attendancePresence.deleteMany({
            where: { attendanceId: { in: attendanceIds } },
          });
        }

        await tx.attendance.deleteMany({
          where: { classId: { in: classIds } },
        });

        await tx.student.deleteMany({
          where: { classId: { in: classIds } },
        });

        await tx.class.deleteMany({
          where: { id: { in: classIds } },
        });
      }

      await tx.school.delete({
        where: { id: schoolId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao excluir escola" },
      { status: 500 }
    );
  }
}
