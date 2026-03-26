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

async function ensureGroupContentAccess(
  userId: string,
  groupId: string,
  contentId: string
) {
  const content = await prisma.groupContent.findFirst({
    where: {
      id: contentId,
      groupId,
    },
  });

  if (!content) return null;

  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership) return null;

  return {
    content,
    canManage: isGroupManagerRole(membership.role),
  };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; contentId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, contentId } = await params;
  const access = await ensureGroupContentAccess(user.id, groupId, contentId);

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!access.canManage) {
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

  const updated = await prisma.groupContent.update({
    where: { id: contentId },
    data: {
      title,
      description: description || null,
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
  { params }: { params: Promise<{ groupId: string; contentId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, contentId } = await params;
  const access = await ensureGroupContentAccess(user.id, groupId, contentId);

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!access.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.groupContent.delete({
    where: { id: contentId },
  });

  return NextResponse.json({ success: true });
}
