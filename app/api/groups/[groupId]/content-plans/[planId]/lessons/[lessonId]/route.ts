import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeRole(role: string | null | undefined) {
  return String(role ?? "").trim().toUpperCase();
}

function isGroupManagerRole(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return normalized === "OWNER" || normalized === "MANAGER";
}

async function ensureLessonAccess(
  userId: string,
  groupId: string,
  planId: string,
  lessonId: string
) {
  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership) return null;

  const lesson = await prisma.contentPlanLesson.findFirst({
    where: {
      id: lessonId,
      contentPlanId: planId,
      contentPlan: {
        groupId,
      },
    },
  });

  if (!lesson) return null;

  return {
    lesson,
    canManage: isGroupManagerRole(membership.role),
  };
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      groupId: string;
      planId: string;
      lessonId: string;
    }>;
  }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, planId, lessonId } = await params;
  const access = await ensureLessonAccess(user.id, groupId, planId, lessonId);

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!access.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();

  const orderIndex = Number(data.orderIndex ?? 0);
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

  const updated = await prisma.contentPlanLesson.update({
    where: { id: lessonId },
    data: {
      orderIndex:
        Number.isFinite(orderIndex) && orderIndex > 0
          ? orderIndex
          : access.lesson.orderIndex,
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
    params: Promise<{
      groupId: string;
      planId: string;
      lessonId: string;
    }>;
  }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, planId, lessonId } = await params;
  const access = await ensureLessonAccess(user.id, groupId, planId, lessonId);

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!access.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.contentPlanLesson.delete({
    where: { id: lessonId },
  });

  return NextResponse.json({ ok: true });
}
