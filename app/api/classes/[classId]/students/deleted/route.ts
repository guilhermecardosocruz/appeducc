import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

function isManagerRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return ["ADMIN", "GESTOR", "MANAGER", "OWNER"].includes(normalized);
}

async function getAccessContext(userId: string, classId: string) {
  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: { school: true },
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
  const isManager =
    isManagerRole(schoolMembership?.role) ||
    isManagerRole(groupMembership?.role);

  return {
    hasAccess,
    isManager,
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

  const access = await getAccessContext(user.id, classId);
  if (!access?.hasAccess || !access.isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deletedStudents = await prisma.deletedStudentArchive.findMany({
    where: { classId },
    include: {
      deletedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      exitDate: "desc",
    },
  });

  return NextResponse.json(
    deletedStudents.map((s) => ({
      id: s.id,
      name: s.name,
      entryDate: s.entryDate,
      exitDate: s.exitDate,
      attendancePercentage: s.attendancePercentage,
      exitReason: s.exitReason,
      deletedBy: s.deletedBy?.name || null,
    }))
  );
}
