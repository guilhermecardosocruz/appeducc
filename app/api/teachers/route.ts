import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateTemporaryPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";

  for (let i = 0; i < length; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  return password;
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teachers = await prisma.user.findMany({
    where: {
      createdById: user.id,
      isTeacher: true,
    },
    include: {
      _count: {
        select: {
          classes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(teachers);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").toLowerCase().trim();

  if (!name || !email) {
    return NextResponse.json(
      { error: "Missing teacher name or email" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const teacher = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      isTeacher: true,
      createdById: user.id,
    },
    include: {
      _count: {
        select: {
          classes: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        isTeacher: teacher.isTeacher,
        createdAt: teacher.createdAt,
        _count: {
          classes: teacher._count.classes,
        },
      },
      temporaryPassword,
    },
    { status: 201 }
  );
}
