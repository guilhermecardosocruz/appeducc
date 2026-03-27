"use client";

import { useMemo, useRef, useState } from "react";

type Lesson = {
  id: string;
  orderIndex: number;
  title: string;
  objectives?: string;
  methodology?: string;
  resources?: string;
  bncc?: string;
};

type LinkedClass = {
  id: string;
  name: string;
  year: number | null;
  status?: string;
  school: {
    id: string;
    name: string;
    group: {
      id: string;
      name: string;
    };
  };
};

type AvailableClass = {
  id: string;
  name: string;
  year: number | null;
  school: {
    id: string;
    name: string;
    group: {
      id: string;
      name: string;
    };
  };
};

type Props = {
  groupId: string;
  planId: string;
  initialLessons: Lesson[];
  linkedClasses: LinkedClass[];
  availableClasses: AvailableClass[];
};

export default function ContentPlanDetailClient({
  groupId,
  planId,
  initialLessons,
  linkedClasses,
  availableClasses,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [currentLinked, setCurrentLinked] = useState<LinkedClass[]>(linkedClasses);
  const [currentAvailable, setCurrentAvailable] =
    useState<AvailableClass[]>(availableClasses);

  const [openForm, setOpenForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [orderIndex, setOrderIndex] = useState("");
  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [methodology, setMethodology] = useState("");
  const [resources, setResources] = useState("");
  const [bncc, setBncc] = useState("");

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [loadingAssignId, setLoadingAssignId] = useState<string | null>(null);
  const [loadingRemoveId, setLoadingRemoveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedAvailable = useMemo(
    () =>
      [...currentAvailable].sort((a, b) => {
        const schoolCompare = a.school.name.localeCompare(b.school.name);
        if (schoolCompare !== 0) return schoolCompare;
        return a.name.localeCompare(b.name);
      }),
    [currentAvailable]
  );

  async function refreshLessons() {
    const res = await fetch(
      `/api/groups/${groupId}/content-plans/${planId}/lessons`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (!res.ok) return;

    const data = (await res.json()) as Array<{
      id: string;
      orderIndex: number;
      title: string;
      objectives: string | null;
      methodology: string | null;
      resources: string | null;
      bncc: string | null;
    }>;

    setLessons(
      data.map((item) => ({
        id: item.id,
        orderIndex: item.orderIndex,
        title: item.title,
        objectives: item.objectives ?? undefined,
        methodology: item.methodology ?? undefined,
        resources: item.resources ?? undefined,
        bncc: item.bncc ?? undefined,
      }))
    );
  }

  async function handleImportFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Envie um arquivo .xlsx.");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/groups/${groupId}/content-plans/${planId}/lessons/import`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao importar planilha.");
        return;
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await refreshLessons();
      alert(`${data?.imported ?? 0} aula(s) importada(s).`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-semibold">Aulas do planejamento</h2>

          <div className="flex flex-wrap gap-2">
            <a
              href="/templates/contents-template.xlsx"
              className="rounded border px-3 py-2 text-sm"
            >
              Modelo Excel
            </a>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importing ? "Importando..." : "Importar Excel"}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleImportFile(file);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
