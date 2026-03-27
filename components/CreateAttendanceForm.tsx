"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AddStudentModal from "./AddStudentModal";

type StudentItem = {
  id: string;
  name: string;
};

type ContentItem = {
  id: string;
  title: string;
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
  contents: ContentItem[];
};

export default function CreateAttendanceForm({
  classId,
  initialTitle = "",
  initialLessonDate,
  students,
  contents,
}: Props) {
  const router = useRouter();
  const [selectedContentId, setSelectedContentId] = useState("");
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

  function handleContentChange(contentId: string) {
    setSelectedContentId(contentId);

    const selected = contents.find((item) => item.id === contentId);
    if (selected) {
      setTitle(selected.title);
    }
  }

  async function handleAddStudent(name: string) {
    setAddingStudent(true);
    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        alert("Erro ao adicionar aluno");
        return;
      }

      router.refresh();
      setOpenStudentModal(false);
    } catch (error) {
      console.error(error);
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
          contentId: selectedContentId || null,
          presences: presences.map((item) => ({
            studentId: item.studentId,
            present: item.present,
          })),
        }),
      });

      if (!res.ok) {
        alert("Erro ao criar chamada");
        return;
      }

      alert("Chamada criada com sucesso!");
      router.push(`/classes/${classId}/chamadas`);
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Conteúdo da aula
              </label>
              <select
                value={selectedContentId}
                onChange={(e) => handleContentChange(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Selecionar conteúdo</option>
                {contents.map((content) => (
                  <option key={content.id} value={content.id}>
                    {content.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Data da aula
              </label>
              <input
                type="date"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Título da chamada
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2">
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
            <button
              type="button"
              onClick={() => setOpenStudentModal(true)}
              className="rounded-md border px-3 py-1 text-sm"
            >
              Adicionar aluno
            </button>
          </div>

          <div className="space-y-2">
            {presences.map((item) => (
              <div
                key={item.studentId}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span>{item.studentName}</span>
                <input
                  type="checkbox"
                  checked={item.present}
                  onChange={() => togglePresence(item.studentId)}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-sky-600 px-4 py-2 text-white"
            >
              Criar chamada
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
