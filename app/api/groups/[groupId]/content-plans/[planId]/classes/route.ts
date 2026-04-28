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

type ClassPayloadItem = {
  id: string;
  name: string;
  year: number | null;
  school: {
    id: string;
    name: string;
    group: {
      id: string;
      name: string;
    };
  };
  status?: string;
};

async function getPlanAccessibleByUser(
  userId: string,
  groupId: string,
  planId: string
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

  const plan = await prisma.contentPlan.findFirst({
    where: {
      id: planId,
      groupId,
    },
    include: {
      lessons: {
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!plan) return null;

  return {
    plan,
    lessons: plan.lessons,
    canManage: isGroupManagerRole(membership.role),
  };
}

async function getPlanClassesPayload(groupId: string, planId: string) {
  const linkedClassesRaw = await prisma.contentPlanClass.findMany({
    where: {
      contentPlanId: planId,
      class: {
        school: {
          groupId,
        },
      },
    },
    include: {
      class: {
        include: {
          school: {
            include: {
              group: true,
            },
          },
        },
      },
    },
    orderBy: [{ class: { school: { name: "asc" } } }, { class: { name: "asc" } }],
  });

  const linkedClassIds = linkedClassesRaw.map((item) => item.classId);

  const availableClassesRaw = await prisma.class.findMany({
    where: {
      id: {
        notIn: linkedClassIds,
      },
      school: {
        groupId,
      },
    },
    include: {
      school: {
        include: {
          group: true,
        },
      },
    },
    orderBy: [{ school: { name: "asc" } }, { name: "asc" }],
  });

  const linkedClasses: ClassPayloadItem[] = linkedClassesRaw.map((item) => ({
    id: item.class.id,
    name: item.class.name,
    year: item.class.year,
    status: item.status,
    school: {
      id: item.class.school.id,
      name: item.class.school.name,
      group: {
        id: item.class.school.group.id,
        name: item.class.school.group.name,
      },
    },
  }));

  const availableClasses: ClassPayloadItem[] = availableClassesRaw.map((item) => ({
    id: item.id,
    name: item.name,
    year: item.year,
    school: {
      id: item.school.id,
      name: item.school.name,
      group: {
        id: item.school.group.id,
        name: item.school.group.name,
      },
    },
  }));

  return {
    linkedClasses,
    availableClasses,
  };
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
  const access = await getPlanAccessibleByUser(user.id, groupId, planId);

  if (!access) {
    return NextResponse.json({ error: "Planning not found" }, { status: 404 });
  }

  if (!access.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const classId = String(body.classId ?? "").trim();
  const force = Boolean(body.force);

  if (!classId) {
    return NextResponse.json({ error: "Missing classId" }, { status: 400 });
  }

  const targetClass = await prisma.class.findFirst({
    where: {
      id: classId,
      school: {
        groupId,
      },
    },
  });

  if (!targetClass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  if (access.lessons.length === 0) {
    return NextResponse.json(
      { error: "Este planejamento ainda não possui aulas." },
      { status: 400 }
    );
  }

  const existingContentsCount = await prisma.content.count({
    where: { classId },
  });

  if (existingContentsCount > 0 && !force) {
    return NextResponse.json(
      {
        error:
          "A turma já possui conteúdos. Confirme para substituir pelo padrão do planejamento.",
        needsConfirmation: true,
      },
      { status: 409 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.contentPlanClass.upsert({
      where: {
        contentPlanId_classId: {
          contentPlanId: planId,
          classId,
        },
      },
      update: {
        status: "LINKED",
      },
      create: {
        contentPlanId: planId,
        classId,
        status: "LINKED",
      },
    });

    await tx.content.deleteMany({
      where: { classId },
    });

    await tx.content.createMany({
      data: access.lessons.map((lesson) => ({
        classId,
        title: lesson.title,
        objectives: lesson.objectives,
        methodology: lesson.methodology,
        resources: lesson.resources,
        bncc: lesson.bncc,
        isCustomized: false,
        sourceContentPlanId: planId,
        sourceContentPlanLessonId: lesson.id,
      })),
    });
  });

  const payload = await getPlanClassesPayload(groupId, planId);
  return NextResponse.json(payload);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; planId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, planId } = await params;
  const access = await getPlanAccessibleByUser(user.id, groupId, planId);

  if (!access) {
    return NextResponse.json({ error: "Planning not found" }, { status: 404 });
  }

  if (!access.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const classId = String(body.classId ?? "").trim();

  if (!classId) {
    return NextResponse.json({ error: "Missing classId" }, { status: 400 });
  }

  const existing = await prisma.contentPlanClass.findFirst({
    where: {
      contentPlanId: planId,
      classId,
      class: {
        school: {
          groupId,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  await prisma.contentPlanClass.delete({
    where: {
      id: existing.id,
    },
  });

  const payload = await getPlanClassesPayload(groupId, planId);
  return NextResponse.json(payload);
}
