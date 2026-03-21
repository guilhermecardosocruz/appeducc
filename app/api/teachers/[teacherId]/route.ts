import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

async function ensureTeacherAccess(userId: string, teacherId: string) {
  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      createdById: userId,
      isTeacher: true,
    },
    include: {
      _count: {
        select: {
          classes: true,
        },
      },
    },
  });

  return teacher;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teacherId } = await params;
  const teacher = await ensureTeacherAccess(user.id, teacherId);

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    cpf: teacher.cpf,
    isTeacher: teacher.isTeacher,
    createdAt: teacher.createdAt,
    _count: {
      classes: teacher._count.classes,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teacherId } = await params;
  const teacher = await ensureTeacherAccess(user.id, teacherId);

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const data = await req.json();
  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").toLowerCase().trim();
  const cpfRaw = String(data.cpf ?? "").trim();
  const cpf = normalizeCpf(cpfRaw);

  if (!name || !email || !cpf) {
    return NextResponse.json(
      { error: "Name, email and CPF are required" },
      { status: 400 }
    );
  }

  if (cpf.length !== 11) {
    return NextResponse.json(
      { error: "CPF must contain 11 digits" },
      { status: 400 }
    );
  }

  const existingByEmail = await prisma.user.findFirst({
    where: {
      email,
      NOT: {
        id: teacherId,
      },
    },
  });

  if (existingByEmail) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }

  const existingByCpf = await prisma.user.findFirst({
    where: {
      cpf,
      NOT: {
        id: teacherId,
      },
    },
  });

  if (existingByCpf) {
    return NextResponse.json(
      { error: "CPF already in use" },
      { status: 409 }
    );
  }

  const updatedTeacher = await prisma.user.update({
    where: { id: teacherId },
    data: {
      name,
      email,
      cpf,
    },
    include: {
      _count: {
        select: {
          classes: true,
        },
      },
    },
  });

  return NextResponse.json({
    teacher: {
      id: updatedTeacher.id,
      name: updatedTeacher.name,
      email: updatedTeacher.email,
      cpf: updatedTeacher.cpf,
      isTeacher: updatedTeacher.isTeacher,
      createdAt: updatedTeacher.createdAt,
      _count: {
        classes: updatedTeacher._count.classes,
      },
    },
  });
}
