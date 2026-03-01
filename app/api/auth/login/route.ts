import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    const url = new URL("/login?error=missing_fields", req.url);
    return NextResponse.redirect(url);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const url = new URL("/login?error=invalid_credentials", req.url);
    return NextResponse.redirect(url);
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    const url = new URL("/login?error=invalid_credentials", req.url);
    return NextResponse.redirect(url);
  }

  const redirectUrl = await createSession(user.id, req.url);
  return NextResponse.redirect(redirectUrl);
}
