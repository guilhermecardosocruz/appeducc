import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isManagerRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return ["ADMIN", "GESTOR", "MANAGER", "OWNER"].includes(normalized);
}

async function getAccessContext(userId: string, classId: string) {
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

  const hasAccess = Boolean(schoolMembership) || Boolean(groupMembership);
  const canManageDelete =
    isManagerRole(schoolMembership?.role) ||
    isManagerRole(groupMembership?.role);

  return {
    hasAccess,
    canManageDelete,
  };
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string; studentId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId, studentId } = await params;

  const access = await getAccessContext(user.id, classId);
  if (!access?.hasAccess || !access.canManageDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      classId: true,
    },
  });

  if (!student || student.classId !== classId) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  await prisma.student.delete({
    where: { id: studentId },
  });

  return NextResponse.json({ success: true });
}
