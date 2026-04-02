import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";

function normalizeRole(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase();
}

function isManagerRole(value: string | null | undefined) {
  const role = normalizeRole(value);
  return role === "OWNER" || role === "MANAGER";
}

function generateTeacherPassword(name: string, cpf: string) {
  const cpfDigits = cpf.replace(/\D/g, "").slice(0, 6);
  const trimmedName = name.trim();

  const firstLetter = trimmedName.charAt(0).toUpperCase();
  const secondLetter = trimmedName.charAt(1).toLowerCase();

  return `${cpfDigits}@${firstLetter}${secondLetter}.`;
}

export async function GET(req: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");

  const memberships = await prisma.groupMember.findMany({
    where: {
      userId: user.id,
    },
    select: {
      groupId: true,
      role: true,
    },
  });

  const accessibleGroupIds = memberships.map((item) => item.groupId);

  if (groupId) {
    const membership = memberships.find((item) => item.groupId === groupId);

    if (!membership || !isManagerRole(membership.role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const memberIds = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });

    const memberUserIds = memberIds.map((item) => item.userId);

    const teachers = await prisma.user.findMany({
      where: {
        isTeacher: true,
        OR: [
          {
            createdById: {
              in: memberUserIds,
            },
          },
          {
            schoolMembers: {
              some: {
                school: {
                  groupId,
                },
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            classes: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(teachers);
  }

  const teachers = await prisma.user.findMany({
    where: {
      isTeacher: true,
      OR: [
        {
          createdById: user.id,
        },
        {
          schoolMembers: {
            some: {
              school: {
                groupId: {
                  in: accessibleGroupIds,
                },
              },
            },
          },
        },
      ],
    },
    include: {
      _count: {
        select: {
          classes: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(teachers);
}

export async function POST(req: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const cpf = String(body?.cpf ?? "").trim();
  const groupId = String(body?.groupId ?? "").trim();

  if (!name || !email || !cpf || !groupId) {
    return NextResponse.json(
      { error: "Nome, e-mail, CPF e grupo são obrigatórios." },
      { status: 400 }
    );
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
  });

  if (!membership || !isManagerRole(membership.role)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { cpf }],
    },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Já existe um usuário com este e-mail ou CPF." },
      { status: 400 }
    );
  }

  const generatedPassword = generateTeacherPassword(name, cpf);
  const passwordHash = await hashPassword(generatedPassword);

  const teacher = await prisma.user.create({
    data: {
      name,
      email,
      cpf,
      passwordHash,
      isTeacher: true,
      createdById: user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      isTeacher: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    teacher,
    temporaryPassword: generatedPassword,
  });
}
