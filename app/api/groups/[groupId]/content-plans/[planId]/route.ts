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

async function ensurePlanAccess(
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
      _count: {
        select: {
          lessons: true,
          classLinks: true,
        },
      },
    },
  });

  if (!plan) return null;

  return {
    plan,
    canManage: isGroupManagerRole(membership.role),
  };
}

export async function PATCH(
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

  const name = String(data.name ?? "").trim();
  const description = String(data.description ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Nome do planejamento é obrigatório." },
      { status: 400 }
    );
  }

  const updated = await prisma.contentPlan.update({
    where: { id: planId },
    data: {
      name,
      description: description || null,
    },
    include: {
      _count: {
        select: {
          lessons: true,
          classLinks: true,
        },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
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

  if (!access.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.contentPlan.delete({
    where: { id: planId },
  });

  return NextResponse.json({ ok: true });
}
