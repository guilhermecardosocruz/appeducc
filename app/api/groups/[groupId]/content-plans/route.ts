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

async function getGroupMembership(userId: string, groupId: string) {
  return prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const membership = await getGroupMembership(user.id, groupId);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plans = await prisma.contentPlan.findMany({
    where: { groupId },
    include: {
      _count: {
        select: {
          lessons: true,
          classLinks: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(plans);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const membership = await getGroupMembership(user.id, groupId);

  if (!membership || !isGroupManagerRole(membership.role)) {
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

  const plan = await prisma.contentPlan.create({
    data: {
      groupId,
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

  return NextResponse.json(plan, { status: 201 });
}
