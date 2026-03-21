import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const cpf = normalizeCpf(String(formData.get("cpf") ?? "").trim());
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !cpf || !password) {
    const url = new URL("/register?error=missing_fields", req.url);
    return NextResponse.redirect(url);
  }

  if (cpf.length !== 11) {
    const url = new URL("/register?error=invalid_cpf", req.url);
    return NextResponse.redirect(url);
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingByEmail) {
    const url = new URL("/register?error=email_in_use", req.url);
    return NextResponse.redirect(url);
  }

  const existingByCpf = await prisma.user.findFirst({
    where: { cpf },
  });

  if (existingByCpf) {
    const url = new URL("/register?error=cpf_in_use", req.url);
    return NextResponse.redirect(url);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      cpf,
      passwordHash,
    },
  });

  const redirectUrl = await createSession(user.id, req.url);
  return NextResponse.redirect(redirectUrl);
}
