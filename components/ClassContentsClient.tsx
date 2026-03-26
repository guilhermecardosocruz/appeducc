"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ContentItem = {
  id: string;
  title: string;
  objectives: string | null;
  methodology: string | null;
  resources: string | null;
  bncc: string | null;
  createdAt: string;
};

type Props = {
  classId: string;
  initialContents: ContentItem[];
  canManageClass: boolean;
};

export default function ClassContentsClient({
  classId,
  initialContents,
  canManageClass,
}: Props) {
  const router = useRouter();

  const [contents, setContents] = useState<ContentItem[]>(initialContents);
  const [openForm, setOpenForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [methodology, setMethodology] = useState("");
  const [resources, setResources] = useState("");
  const [bncc, setBncc] = useState("");

  async function refreshContents() {
    const res = await fetch(`/api/classes/${classId}/contents`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return;
    }

    const data = (await res.json()) as Array<{
      id: string;
      title: string;
      objectives: string | null;
      methodology: string | null;
      resources: string | null;
      bncc: string | null;
      createdAt: string;
    }>;

    setContents(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Nome da aula é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/classes/${classId}/contents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          objectives,
          methodology,
          resources,
          bncc,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Erro ao criar conteúdo.");
        return;
      }

      setTitle("");
      setObjectives("");
      setMethodology("");
      setResources("");
      setBncc("");
      setOpenForm(false);

      await refreshContents();
      router.refresh();
    } catch (submitError) {
      console.error("Erro ao criar conteúdo", submitError);
      setError("Erro ao criar conteúdo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Conteúdos</h1>
          <p className="mt-2 text-sm text-slate-500">
            Organize o planejamento da turma com nome da aula, objetivos,
            metodologia, recursos pedagógicos e habilidades BNCC.
          </p>
        </div>

        {canManageClass ? (
          <button
            type="button"
            onClick={() => {
              setOpenForm((current) => !current);
              setError(null);
            }}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            {openForm ? "Fechar" : "Novo conteúdo"}
          </button>
        ) : null}
      </div>

      {!canManageClass ? (
        <p className="mt-4 text-sm text-amber-700">
          Você está com acesso somente de visualização nesta turma.
        </p>
      ) : null}

      {openForm && canManageClass ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Nome da aula
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aula 01 - Introdução à Robótica"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Objetivos de aprendizagem
            </label>
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Desenvolvimento / Metodologia
            </label>
            <textarea
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Recursos pedagógicos
            </label>
            <textarea
              value={resources}
              onChange={(e) => setResources(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Habilidades BNCC
            </label>
            <textarea
              value={bncc}
              onChange={(e) => setBncc(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar conteúdo"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-6 space-y-4">
        {contents.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum conteúdo cadastrado ainda.
          </p>
        ) : (
          contents.map((content, index) => (
            <div
              key={content.id}
              className="rounded-xl border border-slate-200 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                    Conteúdo {index + 1}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    {content.title}
                  </h2>
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                <section>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Objetivos de aprendizagem
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                    {content.objectives?.trim() || "Não informado."}
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Desenvolvimento / Metodologia
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                    {content.methodology?.trim() || "Não informado."}
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Recursos pedagógicos
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                    {content.resources?.trim() || "Não informado."}
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Habilidades BNCC
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                    {content.bncc?.trim() || "Não informado."}
                  </p>
                </section>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
