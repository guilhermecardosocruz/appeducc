import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isGroupManagerRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string; userId: string }> }
) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, userId } = await params;
  const currentMembership = await getGroupMembership(currentUser.id, groupId);

  if (!currentMembership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isGroupManagerRole(currentMembership.role)) {
    return NextResponse.json(
      { error: "Only owner or manager can remove group members" },
      { status: 403 }
    );
  }

  const targetMembership = await getGroupMembership(userId, groupId);

  if (!targetMembership) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (targetMembership.role === "OWNER") {
    return NextResponse.json(
      { error: "Owner cannot be removed in this version" },
      { status: 400 }
    );
  }

  await prisma.groupMember.delete({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  return NextResponse.json({ success: true });
}
