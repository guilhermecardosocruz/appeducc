import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isGroupManagerRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

async function getGroupAccess(userId: string, groupId: string) {
  const [groupMembership, schoolMemberships] = await Promise.all([
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    }),
    prisma.schoolMember.findMany({
      where: {
        userId,
        school: {
          groupId,
        },
      },
      select: {
        schoolId: true,
        role: true,
      },
    }),
  ]);

  const hasAccess = Boolean(groupMembership) || schoolMemberships.length > 0;
  const canManage = Boolean(
    groupMembership && isGroupManagerRole(groupMembership.role)
  );

  return {
    groupMembership,
    schoolMemberships,
    hasAccess,
    canManage,
  };
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
  const access = await getGroupAccess(user.id, groupId);

  if (!access.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schoolIds = access.groupMembership
    ? undefined
    : access.schoolMemberships.map((item) => item.schoolId);

  const schools = await prisma.school.findMany({
    where: {
      groupId,
      ...(schoolIds ? { id: { in: schoolIds } } : {}),
    },
    include: {
      _count: {
        select: { classes: true },
      },
    },
    orderBy: { name: "asc" },
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
  const access = await getGroupAccess(user.id, groupId);

  if (!access.canManage) {
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
