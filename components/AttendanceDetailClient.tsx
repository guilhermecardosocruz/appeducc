"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AddStudentModal from "./AddStudentModal";

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
  const [openStudentModal, setOpenStudentModal] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);

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

  async function handleAddStudent(name: string) {
    setAddingStudent(true);

    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, attendanceId }),
      });

      if (!res.ok) {
        alert("Erro ao adicionar aluno");
        return;
      }

      const data = await res.json();

      if (data.presence) {
        setPresences((current) => [...current, data.presence]);
      }

      setOpenStudentModal(false);
      router.refresh();
    } finally {
      setAddingStudent(false);
    }
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
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmDelete = confirm(
      "Tem certeza que deseja excluir esta chamada? Todas as presenças serão apagadas."
    );

    if (!confirmDelete) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/attendances/${attendanceId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Erro ao excluir chamada");
        return;
      }

      router.push(`/classes/${classId}/chamadas`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => markAll(true)}
            className="rounded-md border px-3 py-2 text-sm bg-white hover:bg-slate-100"
          >
            Marcar todos
          </button>

          <button
            type="button"
            onClick={() => markAll(false)}
            className="rounded-md border px-3 py-2 text-sm bg-white hover:bg-slate-100"
          >
            Desmarcar todos
          </button>

          <button
            type="button"
            onClick={() => setOpenStudentModal(true)}
            className="rounded-md border px-3 py-2 text-sm bg-white hover:bg-slate-100"
          >
            Adicionar aluno
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-md border">
          {presences.map((item, index) => (
            <div
              key={item.id}
              onClick={() => togglePresence(item.id)}
              className={`flex cursor-pointer items-center justify-between px-4 py-3 ${
                index % 2 === 0 ? "bg-sky-50" : "bg-sky-100"
              } hover:bg-sky-200`}
            >
              <span className="font-medium text-slate-900">
                {item.student.name}
              </span>

              <input
                type="checkbox"
                checked={item.present}
                onClick={(e) => e.stopPropagation()}
                onChange={() => togglePresence(item.id)}
                className="h-5 w-5"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between">
          <Link
            href={`/classes/${classId}/chamadas`}
            className="rounded-md border px-4 py-2 text-sm bg-white hover:bg-slate-100"
          >
            Voltar
          </Link>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="rounded-md bg-red-600 px-4 py-2 text-white disabled:opacity-50"
            >
              Excluir chamada
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="rounded-md bg-sky-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar chamada"}
            </button>
          </div>
        </div>
      </div>

      <AddStudentModal
        open={openStudentModal}
        onClose={() => setOpenStudentModal(false)}
        onSubmit={handleAddStudent}
        loading={addingStudent}
      />
    </>
  );
}
