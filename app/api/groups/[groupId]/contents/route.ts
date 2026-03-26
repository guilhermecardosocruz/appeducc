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

  const contents = await prisma.groupContent.findMany({
    where: { groupId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(contents);
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

  const title = String(data.title ?? "").trim();
  const description = String(data.description ?? "").trim();
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

  const content = await prisma.groupContent.create({
    data: {
      groupId,
      title,
      description: description || null,
      objectives: objectives || null,
      methodology: methodology || null,
      resources: resources || null,
      bncc: bncc || null,
    },
  });

  return NextResponse.json(content, { status: 201 });
}
