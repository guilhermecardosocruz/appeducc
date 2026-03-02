import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

//
// GET /api/groups
// Lista todos os grupos onde o usuário é membro
//
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await prisma.group.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      _count: { select: { schools: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(groups);
}

//
// POST /api/groups
// Cria um grupo e adiciona o usuário como OWNER
//
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const name = String(data.name ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Missing group name" }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: {
      name,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  return NextResponse.json(group, { status: 201 });
}
