import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  context: unknown
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { params } = context as { params: { backupId: string } };
  const { backupId } = params;

  const backup = await prisma.groupBackup.findUnique({
    where: { id: backupId },
  });

  if (!backup) {
    return NextResponse.json({ error: "Backup não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
