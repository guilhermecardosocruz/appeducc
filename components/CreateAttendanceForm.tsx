"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AddStudentModal from "./AddStudentModal";

type StudentItem = {
  id: string;
  name: string;
};

type PresenceDraft = {
  studentId: string;
  studentName: string;
  present: boolean;
};

type Props = {
  classId: string;
  initialTitle?: string;
  initialLessonDate: string;
  students: StudentItem[];
};

export default function CreateAttendanceForm({
  classId,
  initialTitle = "",
  initialLessonDate,
  students,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [lessonDate, setLessonDate] = useState(initialLessonDate);
  const [presences, setPresences] = useState<PresenceDraft[]>(
    students.map((student) => ({
      studentId: student.id,
      studentName: student.name,
      present: true,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [openStudentModal, setOpenStudentModal] = useState(false);

  const summary = useMemo(() => {
    const total = presences.length;
    const presents = presences.filter((item) => item.present).length;
    return { total, presents };
  }, [presences]);

  function togglePresence(studentId: string) {
    setPresences((current) =>
      current.map((item) =>
        item.studentId === studentId ? { ...item, present: !item.present } : item
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
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        console.error("Erro ao adicionar aluno");
        return;
      }

      const data = await res.json();

      setPresences((current) => [
        ...current,
        {
          studentId: data.student.id,
          studentName: data.student.name,
          present: true,
        },
      ]);

      setOpenStudentModal(false);
    } catch (error) {
      console.error("Erro ao adicionar aluno", error);
    } finally {
      setAddingStudent(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !lessonDate) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/classes/${classId}/attendances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          lessonDate,
          presences: presences.map((item) => ({
            studentId: item.studentId,
            present: item.present,
          })),
        }),
      });

      if (!res.ok) {
        console.error("Erro ao criar chamada");
        return;
      }

      const created = await res.json();
      router.push(`/classes/${classId}/chamadas/${created.id}`);
      router.refresh();
    } catch (error) {
      console.error("Erro ao criar chamada", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="grid flex-1 gap-4 md:grid-cols-[1fr_220px]">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Nome da aula
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ex: Aula 01 - Introdução"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Data</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  value={lessonDate}
                  onChange={(e) => setLessonDate(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpenStudentModal(true)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Adicionar aluno
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-sky-600 px-4 py-4 text-white">
            <h1 className="text-lg font-semibold">Lista de chamada</h1>
            <p className="text-sm font-medium">
              Presentes: {summary.presents} / {summary.total}
            </p>
          </div>

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
              <li className="grid grid-cols-[48px_1fr_80px] items-center gap-3 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <span>Nº</span>
                <span>Aluno</span>
                <span className="text-center">✓</span>
              </li>

              {presences.map((item, index) => (
                <li
                  key={item.studentId}
                  className="grid grid-cols-[48px_1fr_80px] items-center gap-3 border-t border-slate-200 px-4 py-3"
                >
                  <span className="text-sm text-slate-500">{index + 1}</span>

                  <span className="text-sm font-medium text-slate-900">
                    {item.studentName}
                  </span>

                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={item.present}
                      onChange={() => togglePresence(item.studentId)}
                      className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar chamada"}
            </button>
          </div>
        </form>
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
