"use client";

import { useState } from "react";

type TeacherOption = {
  id: string;
  name: string;
  email: string;
};

type Props = {
  schoolId: string;
  teachers: TeacherOption[];
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateClassModal({
  schoolId,
  teachers,
  open,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/schools/${schoolId}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          year: year.trim() ? Number(year) : null,
          teacherId: teacherId || null,
        }),
      });

      if (res.ok) {
        setName("");
        setYear("");
        setTeacherId("");
        onCreated();
        onClose();
      } else {
        console.error("Erro ao criar turma");
      }
    } catch (error) {
      console.error("Erro ao criar turma", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Criar nova Turma
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Nome da turma
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ex: 6º Ano A"
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ex: 2026"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Professor responsável
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="">Selecionar depois</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} — {teacher.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-slate-200 px-4 py-2 text-sm hover:bg-slate-300"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar turma"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
