"use client";

import { useState } from "react";

type Lesson = {
  id: string;
  orderIndex: number;
  title: string;
  objectives?: string;
  methodology?: string;
  resources?: string;
  bncc?: string;
};

type Props = {
  groupId: string;
  planId: string;
  initialLessons: Lesson[];
};

export default function ContentPlanDetailClient({
  groupId,
  planId,
  initialLessons,
}: Props) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [openForm, setOpenForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [orderIndex, setOrderIndex] = useState("");
  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [methodology, setMethodology] = useState("");
  const [resources, setResources] = useState("");
  const [bncc, setBncc] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold">Aulas do planejamento</h2>

        <button
          type="button"
          onClick={() => setOpenForm((prev) => !prev)}
          className="rounded bg-sky-600 px-3 py-2 text-sm text-white"
        >
          {openForm ? "Fechar" : "Nova aula"}
        </button>
      </div>

      {(loading || error) && (
        <div className="mt-4 space-y-2">
          {loading ? (
            <p className="text-sm text-slate-500">Salvando alterações...</p>
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
