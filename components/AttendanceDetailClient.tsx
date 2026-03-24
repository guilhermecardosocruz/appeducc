"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  const [title, setTitle] = useState(initialTitle);
  const [lessonDate, setLessonDate] = useState(initialLessonDate);
  const [presences, setPresences] = useState<PresenceItem[]>(initialPresences);
  const [loading, setLoading] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [openStudentModal, setOpenStudentModal] = useState(false);

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

  async function handleAddStudent(name: string) {
    setAddingStudent(true);

    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          attendanceId,
        }),
      });

      if (!res.ok) return;

      const data = await res.json();

      if (data.presence) {
        setPresences((current) => [...current, data.presence]);
      }

      setOpenStudentModal(false);
    } finally {
      setAddingStudent(false);
    }
  }

  async function handleSave() {
    setLoading(true);

    try {
      await fetch(`/api/attendances/${attendanceId}`, {
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

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-sky-600 px-4 py-4 text-white">
            <h1 className="text-lg font-semibold">Lista de chamada</h1>
            <p className="text-sm font-medium">
              Presentes: {summary.presents} / {summary.total}
            </p>
          </div>

          {presences.length === 0 ? (
            <p className="text-sm text-slate-500">
              Ainda não há alunos cadastrados nesta turma.
            </p>
          ) : (
            <ul className="overflow-hidden rounded-md border border-slate-200">
              <li className="grid grid-cols-[48px_1fr_80px] items-center gap-3 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <span>Nº</span>
                <span>Aluno</span>
                <span className="text-center">✓</span>
              </li>

              {presences.map((item, index) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[48px_1fr_80px] items-center gap-3 border-t border-slate-200 px-4 py-3"
                >
                  <span className="text-sm text-slate-500">{index + 1}</span>

                  <span className="text-sm font-medium text-slate-900">
                    {item.student.name}
                  </span>

                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={item.present}
                      onChange={() => togglePresence(item.id)}
                      className="h-5 w-5 rounded border-slate-300 text-sky-600"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

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
              className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white"
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
