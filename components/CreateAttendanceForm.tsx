"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  classId: string;
};

export default function CreateAttendanceForm({ classId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/classes/${classId}/attendances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
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
    <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Nova chamada</h1>
      <p className="mt-2 text-sm text-slate-500">
        Crie uma chamada para registrar a presença dos alunos desta turma.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Título da chamada
          </label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Ex: Chamada 01"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

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
  );
}
