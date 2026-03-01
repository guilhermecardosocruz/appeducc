import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();

  // Futuro: enviar e-mail de recuperação com token.
  // Por enquanto, só retorna sucesso "fake" para o usuário.

  const url = new URL("/recover?success=1", req.url);
  url.searchParams.set("email", email);
  return NextResponse.redirect(url);
}
