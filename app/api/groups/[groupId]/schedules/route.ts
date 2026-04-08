import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type Params = {
  params: Promise<{ groupId: string }>;
};

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  // Busca todas as turmas do grupo + horários
  const classes = await prisma.class.findMany({
    where: {
      school: {
        groupId,
      },
    },
    select: {
      id: true,
      name: true,
      schedules: true,
    },
  });

  // Formatar para frontend
  const result = classes.flatMap((cls) =>
    cls.schedules.map((s) => ({
      id: s.id,
      className: cls.name,
      dayOfWeek: s.dayOfWeek,
      period: s.period,
      startTime: s.startTime,
      endTime: s.endTime,
    }))
  );

  return NextResponse.json(result);
}
