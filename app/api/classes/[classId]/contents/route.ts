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

  const contents = await prisma.content.findMany({
    where: { classId },
    orderBy: [{ createdAt: "asc" }],
  });

  return NextResponse.json(contents);
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

  const data = await req.json();

  const title = String(data.title ?? "").trim();
  const objectives = String(data.objectives ?? "").trim();
  const methodology = String(data.methodology ?? "").trim();
  const resources = String(data.resources ?? "").trim();
  const bncc = String(data.bncc ?? "").trim();

  if (!title) {
    return NextResponse.json(
      { error: "Nome da aula é obrigatório." },
      { status: 400 }
    );
  }

  const content = await prisma.content.create({
    data: {
      classId,
      title,
      objectives: objectives || null,
      methodology: methodology || null,
      resources: resources || null,
      bncc: bncc || null,
    },
  });

  return NextResponse.json(content, { status: 201 });
}
