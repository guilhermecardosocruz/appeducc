import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ schoolId: string; classId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId } = await params;
  const data = await req.json();

  const updated = await prisma.class.update({
    where: { id: classId },
    data: {
      name: data.name,
      year: data.year,
      teacherId: data.teacherId,
    },
  });

  return NextResponse.json(updated);
}
