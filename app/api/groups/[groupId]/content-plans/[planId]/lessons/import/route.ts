import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ImportRow = {
  orderIndex?: unknown;
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

function toPositiveInt(value: unknown) {
  const raw = String(value ?? "").trim();
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

async function ensurePlanAccess(userId: string, groupId: string, planId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership) return null;

  const plan = await prisma.contentPlan.findFirst({
    where: {
      id: planId,
      groupId,
    },
  });

  if (!plan) return null;

  return {
    plan,
    canManage: isGroupManagerRole(membership.role),
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; planId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, planId } = await params;
  const access = await ensurePlanAccess(user.id, groupId, planId);

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

  const currentCount = await prisma.contentPlanLesson.count({
    where: { contentPlanId: planId },
  });

  let fallbackOrderIndex = currentCount + 1;

  const preparedRows = rows
    .map((row) => {
      const title = String(row.title ?? "").trim();
      const explicitOrder = toPositiveInt(row.orderIndex);
      const finalOrderIndex = explicitOrder ?? fallbackOrderIndex++;

      return {
        orderIndex: finalOrderIndex,
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
          "Nenhuma aula válida encontrada. Verifique a coluna 'title' no arquivo.",
      },
      { status: 400 }
    );
  }

  const existingOrderIndexes = new Set(
    (
      await prisma.contentPlanLesson.findMany({
        where: { contentPlanId: planId },
        select: { orderIndex: true },
      })
    ).map((item) => item.orderIndex)
  );

  const normalizedRows = preparedRows.map((row) => {
    let nextOrder = row.orderIndex;
    while (existingOrderIndexes.has(nextOrder)) {
      nextOrder += 1;
    }
    existingOrderIndexes.add(nextOrder);

    return {
      contentPlanId: planId,
      orderIndex: nextOrder,
      title: row.title,
      objectives: row.objectives,
      methodology: row.methodology,
      resources: row.resources,
      bncc: row.bncc,
    };
  });

  await prisma.contentPlanLesson.createMany({
    data: normalizedRows,
  });

  return NextResponse.json({
    imported: normalizedRows.length,
  });
}
