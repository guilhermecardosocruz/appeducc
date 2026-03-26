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

function normalizeRole(role: string | null | undefined) {
  return String(role ?? "").trim().toUpperCase();
}

function isGroupManagerRole(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return normalized === "OWNER" || normalized === "MANAGER";
}

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
}

async function ensureGroupAccess(userId: string, groupId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership) return null;

  return {
    canManage: isGroupManagerRole(membership.role),
  };
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
  const access = await ensureGroupAccess(user.id, groupId);

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
    .map((row) => {
      const title = String(row.title ?? "").trim();

      return {
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

  await prisma.groupContent.createMany({
    data: preparedRows.map((row) => ({
      groupId,
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
