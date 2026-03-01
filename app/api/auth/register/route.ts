import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    const url = new URL("/register?error=missing_fields", req.url);
    return NextResponse.redirect(url);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    const url = new URL("/register?error=email_in_use", req.url);
    return NextResponse.redirect(url);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  const redirectUrl = await createSession(user.id, req.url);
  return NextResponse.redirect(redirectUrl);
}
