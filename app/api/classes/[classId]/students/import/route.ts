import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureClassAccess(userId: string, classId: string) {
  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
    },
  });

  if (!foundClass) return null;

  const membership = await prisma.schoolMember.findUnique({
    where: {
      userId_schoolId: {
        userId,
        schoolId: foundClass.schoolId,
      },
    },
  });

  if (!membership) return null;

  return foundClass;
}

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
      .match(/^(nome|aluno|student|name)$/)
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
  { params }: { params: Promise<{ classId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId } = await params;
  const foundClass = await ensureClassAccess(user.id, classId);

  if (!foundClass) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const filename = file.name || "students.xlsx";
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const extractedNames = extractNamesFromWorkbook(buffer, filename)
    .map((name) => name.trim())
    .filter(Boolean);

  if (extractedNames.length === 0) {
    return NextResponse.json(
      { error: "No student names found in file" },
      { status: 400 }
    );
  }

  const existingStudents = await prisma.student.findMany({
    where: { classId },
    select: { name: true },
  });

  const existingNameSet = new Set(
    existingStudents.map((student) => student.name.trim().toLowerCase())
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

  let createdStudents: { id: string; name: string }[] = [];

  if (uniqueNamesToCreate.length > 0) {
    await prisma.student.createMany({
      data: uniqueNamesToCreate.map((name) => ({
        name,
        classId,
      })),
    });

    createdStudents = await prisma.student.findMany({
      where: {
        classId,
        name: {
          in: uniqueNamesToCreate,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  const classAttendances = await prisma.attendance.findMany({
    where: { classId },
    select: { id: true },
  });

  if (classAttendances.length > 0 && createdStudents.length > 0) {
    await prisma.attendancePresence.createMany({
      data: classAttendances.flatMap((attendance) =>
        createdStudents.map((student) => ({
          attendanceId: attendance.id,
          studentId: student.id,
          present: false,
        }))
      ),
      skipDuplicates: true,
    });
  }

  const students = await prisma.student.findMany({
    where: { classId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    imported: uniqueNamesToCreate.length,
    skipped,
    students,
  });
}
