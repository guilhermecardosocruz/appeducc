import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isManagerRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return ["ADMIN", "GESTOR", "MANAGER", "OWNER"].includes(normalized);
}

async function getApprovalContext(userId: string, classId: string) {
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

  const hasAccess = Boolean(schoolMembership);
  const canApprove =
    isManagerRole(schoolMembership?.role) || isManagerRole(groupMembership?.role);

  return {
    foundClass,
    hasAccess,
    canApprove,
  };
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
  const access = await getApprovalContext(user.id, classId);

  if (!access?.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!access.canApprove) {
    return NextResponse.json(
      { error: "Only management can approve" },
      { status: 403 }
    );
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      classId: true,
      status: true,
    },
  });

  if (!student || student.classId !== classId) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  if (student.status === "PENDING_DELETE") {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, mode: "approved_delete" });
  }

  if (student.status === "PENDING_ENTRY") {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        status: "ACTIVE",
        deletedAt: null,
        deletedReason: null,
        deletedById: null,
      },
    });

    return NextResponse.json({ success: true, mode: "approved_entry" });
  }

  return NextResponse.json(
    { error: "Student is not awaiting approval" },
    { status: 400 }
  );
}
