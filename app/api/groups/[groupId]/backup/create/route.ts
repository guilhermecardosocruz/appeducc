import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type Params = {
  params: Promise<{ groupId: string }>;
};

export async function POST(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { groupId } = await params;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      schools: {
        include: {
          classes: {
            include: {
              students: true,
              contents: true,
              attendances: {
                include: {
                  presences: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
  }

  const backup = await prisma.groupBackup.create({
    data: {
      groupId,
      data: group,
    },
  });

  return NextResponse.json({ success: true, backupId: backup.id });
}
