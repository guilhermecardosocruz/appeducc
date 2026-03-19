"use client";

import { useState } from "react";

type CreatedTeacherResult = {
  teacher: {
    id: string;
    name: string;
    email: string;
    isTeacher: boolean;
    createdAt: string;
    _count: {
      classes: number;
    };
  };
  temporaryPassword: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateTeacherModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedTeacherResult | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) {
        console.error("Erro ao criar professor");
        return;
      }

      const data = (await res.json()) as CreatedTeacherResult;
      setCreated(data);
      setName("");
      setEmail("");
      onCreated();
    } catch (error) {
      console.error("Erro ao criar professor", error);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setCreated(null);
    setName("");
    setEmail("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {!created ? (
          <>
            <h2 className="text-lg font-semibold text-slate-900">
              Adicionar professor
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Cadastre um professor com nome completo e e-mail. A senha será
              gerada automaticamente.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Nome completo
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ex: João da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ex: joao@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  {loading ? "Cadastrando..." : "Cadastrar professor"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-900">
              Professor cadastrado
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Guarde essas credenciais para repassar ao professor.
            </p>

            <div className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Nome
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {created.teacher.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  E-mail
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {created.teacher.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Senha temporária
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {created.temporaryPassword}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
