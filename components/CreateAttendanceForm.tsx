"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
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
  const titleRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

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

  const [titleError, setTitleError] = useState("");
  const [dateError, setDateError] = useState("");

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
    if (selected) setTitle(selected.title);
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

    setTitleError("");
    setDateError("");

    let hasError = false;

    if (!title.trim()) {
      setTitleError("Informe o nome da aula");
      titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      titleRef.current?.focus();
      hasError = true;
    }

    if (!lessonDate) {
      setDateError("Informe a data da aula");
      if (!hasError) {
        dateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        dateRef.current?.focus();
      }
      hasError = true;
    }

    if (hasError) return;

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
          {/* Conteúdo + Data */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Conteúdo da aula
              </label>
              <select
                value={selectedContentId}
                onChange={(e) => handleContentChange(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
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
                ref={dateRef}
                type="date"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-base ${
                  dateError ? "border-red-500" : "border-slate-300"
                }`}
              />
              {dateError && (
                <p className="mt-1 text-sm text-red-600">{dateError}</p>
              )}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Título da chamada
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-base ${
                titleError ? "border-red-500" : "border-slate-300"
              }`}
            />
            {titleError && (
              <p className="mt-1 text-sm text-red-600">{titleError}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-2">
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

          {/* Lista de alunos */}
          <div className="overflow-hidden rounded-md border">
            {presences.map((item, index) => (
              <div
                key={item.studentId}
                onClick={() => togglePresence(item.studentId)}
                className={`flex cursor-pointer items-center justify-between px-4 py-3 ${
                  index % 2 === 0 ? "bg-sky-50" : "bg-sky-100"
                } hover:bg-sky-200`}
              >
                <span className="font-medium text-slate-900">
                  {item.studentName}
                </span>

                <input
                  type="checkbox"
                  checked={item.present}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => togglePresence(item.studentId)}
                  className="h-5 w-5"
                />
              </div>
            ))}
          </div>

          {/* Botão criar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-sky-600 px-4 py-2 text-white disabled:opacity-50"
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
