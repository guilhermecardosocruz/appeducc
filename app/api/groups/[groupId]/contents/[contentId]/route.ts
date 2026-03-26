import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; contentId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contentId } = await params;
  const data = await req.json();

  const content = await prisma.groupContent.update({
    where: { id: contentId },
    data: {
      title: data.title,
      description: data.description,
      objectives: data.objectives,
      methodology: data.methodology,
      resources: data.resources,
      bncc: data.bncc,
    },
  });

  return NextResponse.json(content);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string; contentId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contentId } = await params;

  await prisma.groupContent.delete({
    where: { id: contentId },
  });

  return NextResponse.json({ success: true });
}
