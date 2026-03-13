"use client";

import { useState } from "react";

type Props = {
  groupId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateSchoolModal({
  groupId,
  open,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/groups/${groupId}/schools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setName("");
        onCreated();
        onClose();
      } else {
        console.error("Erro ao criar escola");
      }
    } catch (error) {
      console.error("Erro ao criar escola", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Criar nova Escola
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Nome da escola
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ex: Escola Municipal Centro"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
              {loading ? "Criando..." : "Criar escola"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
