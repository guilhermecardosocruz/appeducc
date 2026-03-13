"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  loading?: boolean;
};

export default function AddStudentModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: Props) {
  const [name, setName] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    await onSubmit(trimmed);
    setName("");
  }

  function handleClose() {
    setName("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">
          Adicionar aluno
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Informe o nome do aluno para adicionar à turma.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Nome do aluno
            </label>
            <input
              type="text"
              autoFocus
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Adicionando..." : "Adicionar aluno"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
