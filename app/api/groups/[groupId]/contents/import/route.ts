import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

type Row = {
  Title?: string;
  Objectives?: string;
  Methodology?: string;
  Resources?: string;
  BNCC?: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "File not provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<Row>(sheet);

  for (const row of rows) {
    await prisma.groupContent.create({
      data: {
        groupId,
        title: row.Title ?? "",
        objectives: row.Objectives ?? "",
        methodology: row.Methodology ?? "",
        resources: row.Resources ?? "",
        bncc: row.BNCC ?? "",
      },
    });
  }

  return NextResponse.json({ success: true });
}
