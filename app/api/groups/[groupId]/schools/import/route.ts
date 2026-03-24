import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function extractNamesFromWorkbook(buffer: Buffer, filename: string) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    raw: false,
    blankrows: false,
  });

  if (!rows.length) {
    return [];
  }

  const normalizedFilename = filename.toLowerCase();
  const firstRow = rows[0] ?? [];
  const headerIndex = firstRow.findIndex((cell) =>
    String(cell ?? "")
      .trim()
      .toLowerCase()
      .match(/^(nome|escola|school|name)$/)
  );

  const hasHeader = headerIndex >= 0;

  if (hasHeader) {
    return rows
      .slice(1)
      .map((row) => String(row[headerIndex] ?? "").trim())
      .filter(Boolean);
  }

  return rows
    .map((row) => String((row[0] ?? "") as string).trim())
    .filter(Boolean)
    .filter((value) => {
      if (!normalizedFilename.endsWith(".csv")) return true;
      return value.toLowerCase() !== "nome";
    });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const filename = file.name || "schools.xlsx";
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const extractedNames = extractNamesFromWorkbook(buffer, filename)
    .map((name) => name.trim())
    .filter(Boolean);

  if (extractedNames.length === 0) {
    return NextResponse.json(
      { error: "No school names found in file" },
      { status: 400 }
    );
  }

  const existingSchools = await prisma.school.findMany({
    where: { groupId },
    select: { name: true },
  });

  const existingNameSet = new Set(
    existingSchools.map((school) => school.name.trim().toLowerCase())
  );

  const uniqueNamesToCreate: string[] = [];
  const seenInFile = new Set<string>();
  let skipped = 0;

  for (const rawName of extractedNames) {
    const normalized = rawName.trim().toLowerCase();

    if (!normalized) {
      skipped += 1;
      continue;
    }

    if (existingNameSet.has(normalized) || seenInFile.has(normalized)) {
      skipped += 1;
      continue;
    }

    seenInFile.add(normalized);
    uniqueNamesToCreate.push(rawName.trim());
  }

  if (uniqueNamesToCreate.length > 0) {
    await prisma.school.createMany({
      data: uniqueNamesToCreate.map((name) => ({
        name,
        groupId,
      })),
    });
  }

  return NextResponse.json({
    imported: uniqueNamesToCreate.length,
    skipped,
  });
}
