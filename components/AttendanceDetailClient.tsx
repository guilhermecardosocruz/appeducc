"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [lessonDate, setLessonDate] = useState(initialLessonDate);
  const [presences, setPresences] = useState<PresenceItem[]>(initialPresences);
  const [loading, setLoading] = useState(false);

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
        alert("Erro ao salvar chamada");
        return;
      }

      alert("Alterações salvas com sucesso!");
      router.push(`/classes/${classId}/chamadas`);
      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar chamada", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Data
          </label>
          <input
            type="date"
            value={lessonDate}
            onChange={(e) => setLessonDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => markAll(true)}
          className="rounded-md border px-3 py-1 text-sm"
        >
          Marcar todos
        </button>
        <button
          type="button"
          onClick={() => markAll(false)}
          className="rounded-md border px-3 py-1 text-sm"
        >
          Desmarcar todos
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {presences.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <span>{item.student.name}</span>
            <input
              type="checkbox"
              checked={item.present}
              onChange={() => togglePresence(item.id)}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <Link
          href={`/classes/${classId}/chamadas`}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Voltar
        </Link>

        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-sky-600 px-4 py-2 text-white"
        >
          Salvar chamada
        </button>
      </div>
    </div>
  );
}
