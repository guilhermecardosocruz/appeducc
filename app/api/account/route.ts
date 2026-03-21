import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf ?? "",
    isTeacher: user.isTeacher,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").toLowerCase().trim();
  const cpf = normalizeCpf(String(data.cpf ?? "").trim());
  const currentPassword = String(data.currentPassword ?? "");
  const newPassword = String(data.newPassword ?? "");
  const confirmNewPassword = String(data.confirmNewPassword ?? "");

  if (!name || !email || !cpf) {
    return NextResponse.json(
      { error: "Nome, e-mail e CPF são obrigatórios." },
      { status: 400 }
    );
  }

  if (cpf.length !== 11) {
    return NextResponse.json(
      { error: "CPF deve conter 11 dígitos." },
      { status: 400 }
    );
  }

  const existingByEmail = await prisma.user.findFirst({
    where: {
      email,
      NOT: { id: user.id },
    },
  });

  if (existingByEmail) {
    return NextResponse.json(
      { error: "Este e-mail já está em uso." },
      { status: 409 }
    );
  }

  const existingByCpf = await prisma.user.findFirst({
    where: {
      cpf,
      NOT: { id: user.id },
    },
  });

  if (existingByCpf) {
    return NextResponse.json(
      { error: "Este CPF já está em uso." },
      { status: 409 }
    );
  }

  const wantsPasswordChange =
    currentPassword.length > 0 ||
    newPassword.length > 0 ||
    confirmNewPassword.length > 0;

  let passwordHash: string | undefined;

  if (wantsPasswordChange) {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json(
        {
          error:
            "Para trocar a senha, preencha senha antiga, senha nova e repetir senha nova.",
        },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const oldPasswordMatches = await verifyPassword(
      currentPassword,
      dbUser.passwordHash
    );

    if (!oldPasswordMatches) {
      return NextResponse.json(
        { error: "A senha antiga está incorreta." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { error: "A nova senha e a confirmação não conferem." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    passwordHash = await hashPassword(newPassword);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      email,
      cpf,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      cpf: updated.cpf ?? "",
      isTeacher: updated.isTeacher,
    },
    passwordChanged: Boolean(passwordHash),
  });
}
