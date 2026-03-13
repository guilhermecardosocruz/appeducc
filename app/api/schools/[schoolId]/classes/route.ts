import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureSchoolAccess(userId: string, schoolId: string) {
  const membership = await prisma.schoolMember.findUnique({
    where: {
      userId_schoolId: {
        userId,
        schoolId,
      },
    },
    include: {
      school: true,
    },
  });

  return membership;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { schoolId } = await params;
  const membership = await ensureSchoolAccess(user.id, schoolId);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const classes = await prisma.class.findMany({
    where: { schoolId },
    include: {
      _count: {
        select: { students: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(classes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { schoolId } = await params;
  const membership = await ensureSchoolAccess(user.id, schoolId);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const name = String(data.name ?? "").trim();
  const yearRaw = data.year;

  if (!name) {
    return NextResponse.json({ error: "Missing class name" }, { status: 400 });
  }

  const year =
    typeof yearRaw === "number" && Number.isFinite(yearRaw) ? yearRaw : null;

  const createdClass = await prisma.class.create({
    data: {
      name,
      year,
      schoolId,
    },
    include: {
      _count: {
        select: { students: true },
      },
    },
  });

  return NextResponse.json(createdClass, { status: 201 });
}
