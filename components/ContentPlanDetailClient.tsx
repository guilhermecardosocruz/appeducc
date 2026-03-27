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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Nome da aula é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/groups/${groupId}/content-plans/${planId}/lessons`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderIndex: orderIndex ? Number(orderIndex) : undefined,
            title,
            objectives,
            methodology,
            resources,
            bncc,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao criar aula.");
        return;
      }

      setOrderIndex("");
      setTitle("");
      setObjectives("");
      setMethodology("");
      setResources("");
      setBncc("");
      setOpenForm(false);

      await refreshLessons();
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!editingLesson) return;

    if (!editingLesson.title.trim()) {
      setError("Nome da aula é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/groups/${groupId}/content-plans/${planId}/lessons/${editingLesson.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderIndex: editingLesson.orderIndex,
            title: editingLesson.title,
            objectives: editingLesson.objectives ?? "",
            methodology: editingLesson.methodology ?? "",
            resources: editingLesson.resources ?? "",
            bncc: editingLesson.bncc ?? "",
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao atualizar aula.");
        return;
      }

      setEditingLesson(null);
      await refreshLessons();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(lessonId: string) {
    const confirmed = window.confirm("Excluir esta aula?");
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/groups/${groupId}/content-plans/${planId}/lessons/${lessonId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao excluir aula.");
        return;
      }

      if (editingLesson?.id === lessonId) {
        setEditingLesson(null);
      }

      await refreshLessons();
    } finally {
      setLoading(false);
    }
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

  async function applyPlanningToClass(classId: string, force = false) {
    const res = await fetch(
      `/api/groups/${groupId}/content-plans/${planId}/classes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, force }),
      }
    );

    const data = (await res.json().catch(() => null)) as
      | {
          linkedClasses?: LinkedClass[];
          availableClasses?: AvailableClass[];
          error?: string;
          needsConfirmation?: boolean;
        }
      | null;

    if (!res.ok) {
      if (res.status === 409 && data?.needsConfirmation) {
        const confirmed = window.confirm(
          "Essa turma já possui conteúdos. Deseja substituir tudo pelo padrão deste planejamento?"
        );

        if (!confirmed) return;

        await applyPlanningToClass(classId, true);
        return;
      }

      setError(data?.error ?? "Erro ao aplicar planejamento na turma.");
      return;
    }

    setCurrentLinked(data?.linkedClasses ?? []);
    setCurrentAvailable(data?.availableClasses ?? []);
  }

  async function assignClass(classId: string) {
    setLoadingAssignId(classId);
    setError(null);

    try {
      await applyPlanningToClass(classId, false);
    } finally {
      setLoadingAssignId(null);
    }
  }

  async function reapplyClass(classId: string) {
    setLoadingAssignId(classId);
    setError(null);

    try {
      await applyPlanningToClass(classId, false);
    } finally {
      setLoadingAssignId(null);
    }
  }

  async function removeClass(classId: string) {
    setLoadingRemoveId(classId);
    setError(null);

    try {
      const res = await fetch(
        `/api/groups/${groupId}/content-plans/${planId}/classes`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId }),
        }
      );

      const data = (await res.json().catch(() => null)) as
        | {
            linkedClasses: LinkedClass[];
            availableClasses: AvailableClass[];
            error?: string;
          }
        | null;

      if (!res.ok) {
        setError(data?.error ?? "Erro ao remover vínculo da turma.");
        return;
      }

      setCurrentLinked(data?.linkedClasses ?? []);
      setCurrentAvailable(data?.availableClasses ?? []);
    } finally {
      setLoadingRemoveId(null);
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

            <button
              type="button"
              onClick={() => setOpenForm((prev) => !prev)}
              className="rounded bg-sky-600 px-3 py-2 text-sm text-white"
            >
              {openForm ? "Fechar" : "Nova aula"}
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

        {(loading || importing || error) && (
          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="text-sm text-slate-500">Salvando alterações...</p>
            ) : null}
            {importing ? (
              <p className="text-sm text-slate-500">Importando aulas...</p>
            ) : null}
            {error ? (
              <p className="text-sm font-medium text-red-600">{error}</p>
            ) : null}
          </div>
        )}

        {openForm ? (
          <form onSubmit={handleCreate} className="mt-6 space-y-3">
            <input
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
              placeholder="Ordem da aula (ex: 1)"
              inputMode="numeric"
              className="w-full rounded border p-2"
            />

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da aula"
              className="w-full rounded border p-2"
            />

            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Objetivos"
              className="w-full rounded border p-2"
            />

            <textarea
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
              placeholder="Metodologia"
              className="w-full rounded border p-2"
            />

            <textarea
              value={resources}
              onChange={(e) => setResources(e.target.value)}
              placeholder="Recursos"
              className="w-full rounded border p-2"
            />

            <textarea
              value={bncc}
              onChange={(e) => setBncc(e.target.value)}
              placeholder="BNCC"
              className="w-full rounded border p-2"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded bg-sky-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </form>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-1 md:grid-cols-3">
          {lessons.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma aula cadastrada ainda.
            </p>
          ) : (
            lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="rounded-lg border p-4 transition hover:bg-slate-50"
              >
                <button
                  type="button"
                  onClick={() => setEditingLesson(lesson)}
                  className="w-full cursor-pointer text-left"
                >
                  <h3 className="font-semibold">
                    Aula {lesson.orderIndex} — {lesson.title}
                  </h3>
                  <p className="text-sm text-slate-500">Clique para editar</p>
                </button>

                <button
                  type="button"
                  onClick={() => void handleDelete(lesson.id)}
                  className="mt-2 text-xs text-red-500"
                >
                  Excluir aula
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Turmas vinculadas
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Estas turmas estão atualmente atribuídas a este planejamento.
          </p>

          {currentLinked.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              Nenhuma turma vinculada ainda.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {currentLinked.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.year ? `Ano letivo ${item.year} • ` : ""}
                        {item.school.group.name} • {item.school.name}
                      </p>
                      <p className="mt-1 text-xs text-sky-700">
                        Status: {item.status ?? "LINKED"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => void reapplyClass(item.id)}
                        disabled={loadingAssignId === item.id}
                        className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                      >
                        {loadingAssignId === item.id
                          ? "Aplicando..."
                          : "Reaplicar padrão"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void removeClass(item.id)}
                        disabled={loadingRemoveId === item.id}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {loadingRemoveId === item.id ? "Removendo..." : "Remover"}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Turmas disponíveis
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Selecione uma turma disponível para vincular e aplicar este planejamento.
          </p>

          {sortedAvailable.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              Não há turmas disponíveis para vínculo no momento.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {sortedAvailable.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.year ? `Ano letivo ${item.year} • ` : ""}
                        {item.school.group.name} • {item.school.name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void assignClass(item.id)}
                      disabled={loadingAssignId === item.id}
                      className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                      {loadingAssignId === item.id
                        ? "Aplicando..."
                        : "Vincular e aplicar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {editingLesson ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[600px] rounded-xl bg-white p-6 space-y-3">
            <h2 className="text-lg font-semibold">Editar aula</h2>

            <input
              value={String(editingLesson.orderIndex)}
              onChange={(e) =>
                setEditingLesson({
                  ...editingLesson,
                  orderIndex: Number(e.target.value || 0),
                })
              }
              inputMode="numeric"
              className="w-full rounded border p-2"
              placeholder="Ordem da aula"
            />

            <input
              value={editingLesson.title}
              onChange={(e) =>
                setEditingLesson({
                  ...editingLesson,
                  title: e.target.value,
                })
              }
              className="w-full rounded border p-2"
            />

            <textarea
              value={editingLesson.objectives ?? ""}
              onChange={(e) =>
                setEditingLesson({
                  ...editingLesson,
                  objectives: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="Objetivos"
            />

            <textarea
              value={editingLesson.methodology ?? ""}
              onChange={(e) =>
                setEditingLesson({
                  ...editingLesson,
                  methodology: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="Metodologia"
            />

            <textarea
              value={editingLesson.resources ?? ""}
              onChange={(e) =>
                setEditingLesson({
                  ...editingLesson,
                  resources: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="Recursos"
            />

            <textarea
              value={editingLesson.bncc ?? ""}
              onChange={(e) =>
                setEditingLesson({
                  ...editingLesson,
                  bncc: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="BNCC"
            />

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => void handleDelete(editingLesson.id)}
                className="rounded bg-red-600 px-4 py-2 text-white"
              >
                Excluir
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="rounded border px-4 py-2"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void handleUpdate()}
                  disabled={loading}
                  className="rounded bg-sky-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
