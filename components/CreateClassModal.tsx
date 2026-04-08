"use client";

import { useEffect, useState } from "react";

type TeacherOption = {
  id: string;
  name: string;
  email: string;
};

type ClassItem = {
  id: string;
  name: string;
  year: number | null;
  teacher: {
    id: string;
  } | null;
};

type Props = {
  schoolId: string;
  teachers: TeacherOption[];
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  editingClass?: ClassItem | null;
};

export default function CreateClassModal({
  schoolId,
  teachers,
  open,
  onClose,
  onCreated,
  editingClass,
}: Props) {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!editingClass;

  useEffect(() => {
    if (editingClass) {
      setName(editingClass.name);
      setYear(editingClass.year ? String(editingClass.year) : "");
      setTeacherId(editingClass.teacher?.id ?? "");
    } else {
      setName("");
      setYear("");
      setTeacherId("");
    }
  }, [editingClass, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(
        isEdit
          ? `/api/schools/${schoolId}/classes/${editingClass!.id}`
          : `/api/schools/${schoolId}/classes`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            year: year.trim() ? Number(year) : null,
            teacherId: teacherId || null,
          }),
        }
      );

      if (res.ok) {
        onCreated();
        onClose();
      } else {
        console.error("Erro ao salvar turma");
      }
    } catch (error) {
      console.error("Erro ao salvar turma", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {isEdit ? "Editar Turma" : "Criar nova Turma"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Nome da turma
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Ano letivo
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Professor
            </label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="">Selecionar depois</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 px-4 py-2 rounded"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-sky-600 text-white px-4 py-2 rounded"
            >
              {loading
                ? isEdit
                  ? "Salvando..."
                  : "Criando..."
                : isEdit
                ? "Salvar"
                : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
