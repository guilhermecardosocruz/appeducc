import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

async function ensureContentAccess(
  userId: string,
  classId: string,
  contentId: string
) {
  const content = await prisma.content.findFirst({
    where: {
      id: contentId,
      classId,
    },
    include: {
      class: {
        include: {
          school: true,
        },
      },
    },
  });

  if (!content) return null;

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId,
          schoolId: content.class.schoolId,
        },
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: content.class.school.groupId,
        },
      },
    }),
  ]);

  const hasAccess = Boolean(schoolMembership) || Boolean(groupMembership);
  const canManage =
    Boolean(schoolMembership) ||
    Boolean(groupMembership && canManageGroupRole(groupMembership.role));

  if (!hasAccess) return null;

  return {
    content,
    canManage,
  };
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ classId: string; contentId: string }>;
  }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId, contentId } = await params;
  const access = await ensureContentAccess(user.id, classId, contentId);

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

  const updated = await prisma.content.update({
    where: {
      id: contentId,
    },
    data: {
      title,
      objectives: objectives || null,
      methodology: methodology || null,
      resources: resources || null,
      bncc: bncc || null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ classId: string; contentId: string }>;
  }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId, contentId } = await params;
  const access = await ensureContentAccess(user.id, classId, contentId);

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!access.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.content.delete({
    where: {
      id: contentId,
    },
  });

  return NextResponse.json({ ok: true });
}
