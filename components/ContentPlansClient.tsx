"use client";

import Link from "next/link";
import { useState } from "react";

type ContentPlan = {
  id: string;
  name: string;
  description?: string;
  _count: {
    lessons: number;
    classLinks: number;
  };
};

type Props = {
  groupId: string;
  initialPlans: ContentPlan[];
};

export default function ContentPlansClient({
  groupId,
  initialPlans,
}: Props) {
  const [plans, setPlans] = useState<ContentPlan[]>(initialPlans);
  const [openForm, setOpenForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ContentPlan | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshPlans() {
    const res = await fetch(`/api/groups/${groupId}/content-plans`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) return;

    const data = (await res.json()) as Array<{
      id: string;
      name: string;
      description: string | null;
      _count: {
        lessons: number;
        classLinks: number;
      };
    }>;

    setPlans(
      data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? undefined,
        _count: item._count,
      }))
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Nome do planejamento é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/content-plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao criar planejamento.");
        return;
      }

      setName("");
      setDescription("");
      setOpenForm(false);

      await refreshPlans();
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!editingPlan) return;

    if (!editingPlan.name.trim()) {
      setError("Nome do planejamento é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/groups/${groupId}/content-plans/${editingPlan.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editingPlan.name,
            description: editingPlan.description ?? "",
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao atualizar planejamento.");
        return;
      }

      setEditingPlan(null);
      await refreshPlans();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(planId: string) {
    const confirmed = window.confirm("Excluir este planejamento?");
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/groups/${groupId}/content-plans/${planId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao excluir planejamento.");
        return;
      }

      if (editingPlan?.id === planId) {
        setEditingPlan(null);
      }

      await refreshPlans();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Planejamentos de conteúdo</h1>

        <button
          type="button"
          onClick={() => setOpenForm((prev) => !prev)}
          className="rounded bg-sky-600 px-3 py-2 text-sm text-white"
        >
          {openForm ? "Fechar" : "Novo planejamento"}
        </button>
      </div>

      {(loading || error) && (
        <div className="mt-4 space-y-2">
          {loading ? (
            <p className="text-sm text-slate-500">Salvando alterações...</p>
          ) : null}
          {error ? (
            <p className="text-sm font-medium text-red-600">{error}</p>
          ) : null}
        </div>
      )}

      {openForm ? (
        <form onSubmit={handleCreate} className="mt-6 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do planejamento"
            className="w-full rounded border p-2"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
            className="w-full rounded border p-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-sky-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </form>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-1 md:grid-cols-3">
        {plans.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum planejamento cadastrado ainda.
          </p>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-lg border p-4 transition hover:bg-slate-50"
            >
              <Link
                href={`/groups/${groupId}/content-plans/${plan.id}`}
                className="block"
              >
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {plan._count.lessons} aula(s) • {plan._count.classLinks} turma(s)
                </p>
                <p className="mt-2 text-sm text-slate-500">Abrir planejamento</p>
              </Link>

              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPlan(plan)}
                  className="text-xs text-sky-700"
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => void handleDelete(plan.id)}
                  className="text-xs text-red-500"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingPlan ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[600px] rounded-xl bg-white p-6 space-y-3">
            <h2 className="text-lg font-semibold">Editar planejamento</h2>

            <input
              value={editingPlan.name}
              onChange={(e) =>
                setEditingPlan({
                  ...editingPlan,
                  name: e.target.value,
                })
              }
              className="w-full rounded border p-2"
            />

            <textarea
              value={editingPlan.description ?? ""}
              onChange={(e) =>
                setEditingPlan({
                  ...editingPlan,
                  description: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="Descrição"
            />

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => void handleDelete(editingPlan.id)}
                className="rounded bg-red-600 px-4 py-2 text-white"
              >
                Excluir
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="rounded border px-4 py-2"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void handleUpdate()}
                  disabled={loading}
                  className="rounded bg-sky-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
