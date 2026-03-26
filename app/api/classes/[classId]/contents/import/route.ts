import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ImportRow = {
  title?: unknown;
  objectives?: unknown;
  methodology?: unknown;
  resources?: unknown;
  bncc?: unknown;
};

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

async function ensureClassAccess(userId: string, classId: string) {
  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
    },
  });

  if (!foundClass) return null;

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId,
          schoolId: foundClass.schoolId,
        },
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: foundClass.school.groupId,
        },
      },
    }),
  ]);

  const hasAccess = Boolean(schoolMembership) || Boolean(groupMembership);
  const canManage =
    Boolean(schoolMembership) ||
    Boolean(groupMembership && canManageGroupRole(groupMembership.role));

  if (!hasAccess) return null;

  return {
    foundClass,
    canManage,
  };
}

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
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
  const access = await ensureClassAccess(user.id, classId);

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!access.canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Arquivo XLSX não enviado." },
      { status: 400 }
    );
  }

  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith(".xlsx")) {
    return NextResponse.json(
      { error: "Envie um arquivo .xlsx." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return NextResponse.json(
      { error: "A planilha está vazia." },
      { status: 400 }
    );
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, {
    defval: "",
  });

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "A planilha não possui linhas para importar." },
      { status: 400 }
    );
  }

  const preparedRows = rows
    .map((row, index) => {
      const title = String(row.title ?? "").trim();

      return {
        line: index + 2,
        title,
        objectives: toNullableString(row.objectives),
        methodology: toNullableString(row.methodology),
        resources: toNullableString(row.resources),
        bncc: toNullableString(row.bncc),
      };
    })
    .filter((row) => row.title);

  if (preparedRows.length === 0) {
    return NextResponse.json(
      {
        error:
          "Nenhum conteúdo válido encontrado. Verifique a coluna 'title' no arquivo.",
      },
      { status: 400 }
    );
  }

  await prisma.content.createMany({
    data: preparedRows.map((row) => ({
      classId,
      title: row.title,
      objectives: row.objectives,
      methodology: row.methodology,
      resources: row.resources,
      bncc: row.bncc,
    })),
  });

  return NextResponse.json({
    imported: preparedRows.length,
  });
}
