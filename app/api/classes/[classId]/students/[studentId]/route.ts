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
  const canManageClass =
    Boolean(schoolMembership) || isManagerRole(groupMembership?.role);
  const canManageDelete =
    isManagerRole(schoolMembership?.role) || isManagerRole(groupMembership?.role);

  return {
    foundClass,
    hasAccess,
    canManageClass,
    canManageDelete,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string; studentId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId, studentId } = await params;
  const access = await getAccessContext(user.id, classId);

  if (!access?.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      presences: true,
    },
  });

  if (!student || student.classId !== classId) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const total = student.presences.length;
  const presents = student.presences.filter((p) => p.present).length;
  const absents = total - presents;
  const percentage = total ? Math.round((presents / total) * 100) : 0;

  return NextResponse.json({
    id: student.id,
    name: student.name,
    status: student.status,
    deletedAt: student.deletedAt,
    deletedReason: student.deletedReason,
    canApproveDelete: access.canManageDelete,
    canManageClass: access.canManageClass,
    stats: {
      total,
      presents,
      absents,
      percentage,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string; studentId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId, studentId } = await params;
  const { name } = await req.json();

  const access = await getAccessContext(user.id, classId);
  if (!access?.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!access.canManageClass) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const normalizedName = String(name ?? "").trim();

  if (!normalizedName) {
    return NextResponse.json({ error: "Missing student name" }, { status: 400 });
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

  await prisma.student.update({
    where: { id: studentId },
    data: { name: normalizedName },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string; studentId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId, studentId } = await params;
  const access = await getAccessContext(user.id, classId);

  if (!access?.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!access.canManageClass) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = String(body?.reason ?? "").trim();

  if (!reason) {
    return NextResponse.json(
      { error: "Motivo da exclusão é obrigatório" },
      { status: 400 }
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

  if (access.canManageDelete) {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        status: "DELETED",
        deletedReason: reason,
        deletedById: user.id,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      mode: "deleted_directly",
    });
  }

  await prisma.student.update({
    where: { id: studentId },
    data: {
      status: "PENDING_DELETE",
      deletedReason: reason,
      deletedById: user.id,
      deletedAt: null,
    },
  });

  return NextResponse.json({
    success: true,
    mode: "requested_delete",
  });
}
