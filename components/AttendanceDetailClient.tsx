"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PresenceItem = {
  id: string;
  present: boolean;
  student: {
    id: string;
    name: string;
  };
};

type Props = {
  attendanceId: string;
  classId: string;
  initialTitle: string;
  initialLessonDate: string;
  initialPresences: PresenceItem[];
};

export default function AttendanceDetailClient({
  attendanceId,
  classId,
  initialTitle,
  initialLessonDate,
  initialPresences,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [lessonDate, setLessonDate] = useState(initialLessonDate);
  const [presences, setPresences] = useState<PresenceItem[]>(initialPresences);
  const [loading, setLoading] = useState(false);

  const summary = useMemo(() => {
    const total = presences.length;
    const presents = presences.filter((item) => item.present).length;
    return { total, presents };
  }, [presences]);

  function togglePresence(id: string) {
    setPresences((current) =>
      current.map((item) =>
        item.id === id ? { ...item, present: !item.present } : item
      )
    );
  }

  function markAll(value: boolean) {
    setPresences((current) =>
      current.map((item) => ({
        ...item,
        present: value,
      }))
    );
  }

  async function handleSave() {
    setLoading(true);

    try {
      const res = await fetch(`/api/attendances/${attendanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          lessonDate,
          presences: presences.map((item) => ({
            id: item.id,
            present: item.present,
          })),
        }),
      });

      if (!res.ok) {
        console.error("Erro ao salvar chamada");
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error("Erro ao salvar chamada", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Editar chamada</h1>
      <p className="mt-2 text-sm text-slate-500">
        Atualize os dados e a presença dos alunos desta chamada.
      </p>

      <div className="mt-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Nome da aula
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="max-w-xs">
            <label className="text-sm font-medium text-slate-700">Data</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200">
          <div className="flex flex-col gap-3 rounded-t-lg bg-sky-600 px-4 py-4 text-white md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold">Lista de presença</h2>
            <p className="text-sm font-medium">
              Presentes: {summary.presents} / {summary.total}
            </p>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => markAll(true)}
                className="rounded-md border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
              >
                Marcar todos
              </button>

              <button
                type="button"
                onClick={() => markAll(false)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Desmarcar todos
              </button>
            </div>

            {presences.length === 0 ? (
              <p className="text-sm text-slate-500">
                Ainda não há alunos cadastrados nesta turma.
              </p>
            ) : (
              <ul className="overflow-hidden rounded-md border border-slate-200">
                <li className="grid grid-cols-[56px_1fr_120px] items-center gap-3 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  <span>#</span>
                  <span>Aluno</span>
                  <span className="text-right">Presença</span>
                </li>

                {presences.map((item, index) => (
                  <li
                    key={item.id}
                    className="grid grid-cols-[56px_1fr_120px] items-center gap-3 border-t border-slate-200 px-4 py-3"
                  >
                    <span className="text-sm text-slate-500">{index + 1}</span>
                    <span className="text-sm font-medium text-slate-900">
                      {item.student.name}
                    </span>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => togglePresence(item.id)}
                        className={[
                          "rounded-md px-3 py-2 text-sm font-medium transition",
                          item.present
                            ? "bg-sky-600 text-white hover:bg-sky-700"
                            : "bg-slate-200 text-slate-800 hover:bg-slate-300",
                        ].join(" ")}
                      >
                        {item.present ? "Presente" : "Faltou"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <Link
            href={`/classes/${classId}/chamadas`}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Voltar
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar chamada"}
          </button>
        </div>
      </div>
    </div>
  );
}
