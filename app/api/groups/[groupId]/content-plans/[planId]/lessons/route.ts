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

async function ensurePlanAccess(userId: string, groupId: string, planId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership) return null;

  const plan = await prisma.contentPlan.findFirst({
    where: {
      id: planId,
      groupId,
    },
  });

  if (!plan) return null;

  return {
    plan,
    canManage: isGroupManagerRole(membership.role),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string; planId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, planId } = await params;
  const access = await ensurePlanAccess(user.id, groupId, planId);

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lessons = await prisma.contentPlanLesson.findMany({
    where: { contentPlanId: planId },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(lessons);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; planId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, planId } = await params;
  const access = await ensurePlanAccess(user.id, groupId, planId);

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

  const finalOrderIndex =
    Number.isFinite(orderIndex) && orderIndex > 0
      ? orderIndex
      : (await prisma.contentPlanLesson.count({
          where: { contentPlanId: planId },
        })) + 1;

  const lesson = await prisma.contentPlanLesson.create({
    data: {
      contentPlanId: planId,
      orderIndex: finalOrderIndex,
      title,
      objectives: objectives || null,
      methodology: methodology || null,
      resources: resources || null,
      bncc: bncc || null,
    },
  });

  return NextResponse.json(lesson, { status: 201 });
}
