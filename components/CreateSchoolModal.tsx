"use client";

import { useRef, useState } from "react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function handleCreate(e: React.FormEvent) {
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
        alert("Erro ao criar escola");
      }
    } catch {
      alert("Erro ao criar escola");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `/api/groups/${groupId}/schools/import`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      alert("Erro ao importar planilha");
      return;
    }

    const data = await res.json();
    alert(`Importadas: ${data.imported} | Ignoradas: ${data.skipped}`);
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Adicionar Escola
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar manualmente"}
          </button>
        </form>

        <div className="my-4 border-t pt-4">
          <p className="mb-2 text-sm text-slate-600">
            Ou importar por planilha
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Importar planilha
            </button>

            <a
              href="/templates/schools-template.csv"
              className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-center text-sm hover:bg-slate-50"
            >
              Baixar template
            </a>
          </div>

          <input
            type="file"
            accept=".csv,.xlsx"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
            }}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-200 px-4 py-2 text-sm hover:bg-slate-300"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
