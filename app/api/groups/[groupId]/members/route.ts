import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

function isGroupManagerRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

function generateTemporaryPassword(name: string, cpf: string) {
  const cleanCpf = normalizeCpf(cpf);
  const trimmedName = name.trim();

  if (cleanCpf.length < 6 || trimmedName.length < 2) {
    return null;
  }

  const cpfPart = cleanCpf.slice(0, 6);
  const firstLetter = trimmedName.charAt(0).toUpperCase();
  const secondLetter = trimmedName.charAt(1).toLowerCase();

  return `${cpfPart}@${firstLetter}${secondLetter}.`;
}

async function getGroupMembership(userId: string, groupId: string) {
  return prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    include: {
      group: true,
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

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          cpf: true,
          isTeacher: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(
    members.map((item) => ({
      userId: item.user.id,
      name: item.user.name,
      email: item.user.email,
      cpf: item.user.cpf,
      isTeacher: item.user.isTeacher,
      role: item.role,
      memberSince: item.createdAt,
      createdAt: item.user.createdAt,
    }))
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const membership = await getGroupMembership(currentUser.id, groupId);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isGroupManagerRole(membership.role)) {
    return NextResponse.json(
      { error: "Only owner or manager can manage group members" },
      { status: 403 }
    );
  }

  const data = await req.json();

  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim().toLowerCase();
  const cpf = normalizeCpf(String(data.cpf ?? "").trim());
  const roleRaw = String(data.role ?? "").trim().toUpperCase();

  const allowedRoles = ["MANAGER", "VIEWER"];

  if (!email || !roleRaw) {
    return NextResponse.json(
      { error: "Email and role are required" },
      { status: 400 }
    );
  }

  if (!allowedRoles.includes(roleRaw)) {
    return NextResponse.json(
      { error: "Invalid role. Use MANAGER or VIEWER." },
      { status: 400 }
    );
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  let userId = existingUser?.id ?? null;
  let temporaryPassword: string | null = null;
  let createdUser = false;

  if (!existingUser) {
    if (!name || !cpf) {
      return NextResponse.json(
        { error: "Name and CPF are required to create a new account" },
        { status: 400 }
      );
    }

    if (cpf.length !== 11) {
      return NextResponse.json(
        { error: "CPF must contain 11 digits" },
        { status: 400 }
      );
    }

    const existingByCpf = await prisma.user.findFirst({
      where: { cpf },
      select: { id: true },
    });

    if (existingByCpf) {
      return NextResponse.json(
        { error: "CPF already in use" },
        { status: 409 }
      );
    }

    temporaryPassword = generateTemporaryPassword(name, cpf);

    if (!temporaryPassword) {
      return NextResponse.json(
        { error: "Could not generate temporary password" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(temporaryPassword);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        cpf,
        passwordHash,
        createdById: currentUser.id,
      },
      select: {
        id: true,
      },
    });

    userId = newUser.id;
    createdUser = true;
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Could not resolve user" },
      { status: 500 }
    );
  }

  const existingMembership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (existingMembership) {
    return NextResponse.json(
      { error: "User is already a member of this group" },
      { status: 409 }
    );
  }

  const createdMembership = await prisma.groupMember.create({
    data: {
      userId,
      groupId,
      role: roleRaw,
      canManageSchools: false,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          cpf: true,
          isTeacher: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      member: {
        userId: createdMembership.user.id,
        name: createdMembership.user.name,
        email: createdMembership.user.email,
        cpf: createdMembership.user.cpf,
        isTeacher: createdMembership.user.isTeacher,
        role: createdMembership.role,
        memberSince: createdMembership.createdAt,
        createdAt: createdMembership.user.createdAt,
      },
      temporaryPassword,
      createdUser,
    },
    { status: 201 }
  );
}
