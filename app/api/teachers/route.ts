import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

function generateTeacherPassword(name: string, cpf: string) {
  const cleanName = name.trim().replace(/\s+/g, "");
  const cleanCpf = normalizeCpf(cpf);

  if (cleanName.length < 3 || cleanCpf.length < 6) {
    return null;
  }

  const first = cleanName[0].toUpperCase();
  const second = cleanName[1].toLowerCase();
  const third = cleanName[2].toUpperCase();
  const cpfPart = cleanCpf.slice(0, 6);

  return `${first}${second}${third}@${cpfPart}.`;
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

  return NextResponse.json(
    teachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      cpf: teacher.cpf,
      isTeacher: teacher.isTeacher,
      createdAt: teacher.createdAt,
      _count: {
        classes: teacher._count.classes,
      },
    }))
  );
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").toLowerCase().trim();
  const cpfRaw = String(data.cpf ?? "").trim();
  const cpf = normalizeCpf(cpfRaw);

  if (!name || !email || !cpf) {
    return NextResponse.json(
      { error: "Missing teacher name, email or CPF" },
      { status: 400 }
    );
  }

  if (cpf.length !== 11) {
    return NextResponse.json(
      { error: "CPF must contain 11 digits" },
      { status: 400 }
    );
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  });

  // Se usuário já existe → não altera senha
  if (existingByEmail) {
    const updated = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        isTeacher: true,
        createdById: user.id,
        cpf: existingByEmail.cpf ?? cpf,
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
          id: updated.id,
          name: updated.name,
          email: updated.email,
          cpf: updated.cpf,
          isTeacher: updated.isTeacher,
          createdAt: updated.createdAt,
          _count: {
            classes: updated._count.classes,
          },
        },
        message: "Usuário já existia. Senha não foi alterada.",
      },
      { status: 200 }
    );
  }

  const temporaryPassword = generateTeacherPassword(name, cpf);

  if (!temporaryPassword) {
    return NextResponse.json(
      { error: "Could not generate password from provided name and CPF" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(temporaryPassword);

  const teacher = await prisma.user.create({
    data: {
      name,
      email,
      cpf,
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
        cpf: teacher.cpf,
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
