"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Content = {
  id: string;
  title: string;
};

type Props = {
  classId: string;
  contents: Content[];
};

export default function ClassContentsPdfSelectorClient({
  classId,
  contents,
}: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    contents.map((content) => content.id)
  );

  function toggleContent(contentId: string) {
    setSelectedIds((current) =>
      current.includes(contentId)
        ? current.filter((id) => id !== contentId)
        : [...current, contentId]
    );
  }

  function markAll() {
    setSelectedIds(contents.map((content) => content.id));
  }

  function unmarkAll() {
    setSelectedIds([]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const params = new URLSearchParams();
    for (const contentId of selectedIds) {
      params.append("contentId", contentId);
    }

    router.push(
      `/classes/${classId}/conteudos-pdf/print${
        params.toString() ? `?${params.toString()}` : ""
      }`
    );
  }

  return (
    <main className="min-h-screen bg-white px-8 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href={`/classes/${classId}/conteudos`}
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          ← Voltar para conteúdos
        </Link>

        <h1 className="mt-6 text-2xl font-semibold text-slate-900">
          Gerar PDF dos conteúdos
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Selecione as aulas que deseja incluir no PDF.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={markAll}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Marcar tudo
          </button>

          <button
            type="button"
            onClick={unmarkAll}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Desmarcar tudo
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {contents.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Nenhum conteúdo cadastrado para esta turma.
            </div>
          ) : (
            contents.map((content) => {
              const checked = selectedIds.includes(content.id);

              return (
                <label
                  key={content.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleContent(content.id)}
                  />
                  <span className="text-sm text-slate-800">{content.title}</span>
                </label>
              );
            })
          )}

          <button
            type="submit"
            disabled={selectedIds.length === 0}
            className="mt-4 rounded bg-sky-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Salvar em PDF
          </button>
        </form>
      </div>
    </main>
  );
}
