import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureGroupAccess(userId: string, groupId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  return membership;
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
  const membership = await ensureGroupAccess(user.id, groupId);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schools = await prisma.school.findMany({
    where: { groupId },
    include: {
      _count: {
        select: { classes: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(schools);
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
  const membership = await ensureGroupAccess(user.id, groupId);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const name = String(data.name ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Missing school name" }, { status: 400 });
  }

  const school = await prisma.school.create({
    data: {
      name,
      groupId,
      members: {
        create: {
          userId: user.id,
          role: "DIRECTOR",
        },
      },
    },
    include: {
      _count: {
        select: { classes: true },
      },
    },
  });

  return NextResponse.json(school, { status: 201 });
}
