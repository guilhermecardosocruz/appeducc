import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type Params = {
  params: Promise<{
    groupId: string;
    planId: string;
  }>;
};

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

export async function POST(req: Request, { params }: Params) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, planId } = await params;

  const body = await req.json();
  const { classId } = body;

  if (!classId) {
    return NextResponse.json({ error: "Missing classId" }, { status: 400 });
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
  });

  if (!membership || !canManageGroupRole(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plan = await prisma.contentPlan.findUnique({
    where: { id: planId },
    include: {
      lessons: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    // 🔥 remove conteúdos antigos
    await tx.content.deleteMany({
      where: { classId },
    });

    // 🔥 recria conteúdos
    await tx.content.createMany({
      data: plan.lessons.map((lesson, index) => ({
        classId,
        seq: index + 1,
        title: lesson.title,
        objectives: lesson.objectives,
        methodology: lesson.methodology,
        resources: lesson.resources,
        bncc: lesson.bncc,
        isCustomized: false,
      })),
    });

    // 🔗 verifica se já existe vínculo
    const existing = await tx.contentPlanClass.findFirst({
      where: {
        classId,
        contentPlanId: planId,
      },
    });

    if (!existing) {
      await tx.contentPlanClass.create({
        data: {
          classId,
          contentPlanId: planId,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, planId } = await params;

  const body = await req.json();
  const { classId } = body;

  if (!classId) {
    return NextResponse.json({ error: "Missing classId" }, { status: 400 });
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
  });

  if (!membership || !canManageGroupRole(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.content.deleteMany({
      where: { classId },
    });

    await tx.contentPlanClass.deleteMany({
      where: {
        classId,
        contentPlanId: planId,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
