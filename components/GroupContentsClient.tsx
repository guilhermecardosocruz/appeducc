"use client";

import { useRef, useState } from "react";

type Content = {
  id: string;
  title: string;
  description?: string;
  objectives?: string;
  methodology?: string;
  resources?: string;
  bncc?: string;
};

type Props = {
  initialContents: Content[];
  groupId: string;
};

export default function GroupContentsClient({
  initialContents,
  groupId,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [contents, setContents] = useState<Content[]>(initialContents);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [methodology, setMethodology] = useState("");
  const [resources, setResources] = useState("");
  const [bncc, setBncc] = useState("");

  const [editing, setEditing] = useState<Content | null>(null);
  const [openForm, setOpenForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshContents() {
    const res = await fetch(`/api/groups/${groupId}/contents`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) return;

    const data = (await res.json()) as Content[];
    setContents(
      data.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description ?? undefined,
        objectives: item.objectives ?? undefined,
        methodology: item.methodology ?? undefined,
        resources: item.resources ?? undefined,
        bncc: item.bncc ?? undefined,
      }))
    );
  }

  async function createContent(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Nome da aula é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/contents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          objectives,
          methodology,
          resources,
          bncc,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao criar conteúdo.");
        return;
      }

      setTitle("");
      setDescription("");
      setObjectives("");
      setMethodology("");
      setResources("");
      setBncc("");
      setOpenForm(false);

      await refreshContents();
    } finally {
      setLoading(false);
    }
  }

  async function updateContent() {
    if (!editing) return;

    if (!editing.title.trim()) {
      setError("Nome da aula é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/contents/${editing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editing.title,
          description: editing.description ?? "",
          objectives: editing.objectives ?? "",
          methodology: editing.methodology ?? "",
          resources: editing.resources ?? "",
          bncc: editing.bncc ?? "",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao atualizar conteúdo.");
        return;
      }

      setEditing(null);
      await refreshContents();
    } finally {
      setLoading(false);
    }
  }

  async function deleteContent(id: string) {
    const confirmed = window.confirm("Excluir conteúdo?");
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/contents/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao excluir conteúdo.");
        return;
      }

      if (editing?.id === id) {
        setEditing(null);
      }

      await refreshContents();
    } finally {
      setLoading(false);
    }
  }

  async function handleImportFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Envie um arquivo .xlsx.");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/groups/${groupId}/contents/import`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao importar planilha.");
        return;
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await refreshContents();
      alert(`${data?.imported ?? 0} conteúdo(s) importado(s).`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Conteúdos do grupo</h1>

        <div className="flex flex-wrap gap-2">
          <a
            href="/templates/contents-template.xlsx"
            className="rounded border px-3 py-2 text-sm"
          >
            Modelo Excel
          </a>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? "Importando..." : "Importar Excel"}
          </button>

          <button
            type="button"
            onClick={() => setOpenForm((prev) => !prev)}
            className="rounded bg-sky-600 px-3 py-2 text-sm text-white"
          >
            {openForm ? "Fechar" : "Novo conteúdo"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleImportFile(file);
              }
            }}
          />
        </div>
      </div>

      {(loading || importing || error) && (
        <div className="mt-4 space-y-2">
          {loading ? (
            <p className="text-sm text-slate-500">Salvando alterações...</p>
          ) : null}
          {importing ? (
            <p className="text-sm text-slate-500">Importando conteúdos...</p>
          ) : null}
          {error ? (
            <p className="text-sm font-medium text-red-600">{error}</p>
          ) : null}
        </div>
      )}

      {openForm ? (
        <form onSubmit={createContent} className="mt-6 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome da aula"
            className="w-full rounded border p-2"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
            className="w-full rounded border p-2"
          />

          <textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder="Objetivos"
            className="w-full rounded border p-2"
          />

          <textarea
            value={methodology}
            onChange={(e) => setMethodology(e.target.value)}
            placeholder="Metodologia"
            className="w-full rounded border p-2"
          />

          <textarea
            value={resources}
            onChange={(e) => setResources(e.target.value)}
            placeholder="Recursos"
            className="w-full rounded border p-2"
          />

          <textarea
            value={bncc}
            onChange={(e) => setBncc(e.target.value)}
            placeholder="BNCC"
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
        {contents.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum conteúdo cadastrado ainda.
          </p>
        ) : (
          contents.map((content) => (
            <div
              key={content.id}
              className="rounded-lg border p-4 transition hover:bg-slate-50"
            >
              <button
                type="button"
                onClick={() => setEditing(content)}
                className="w-full cursor-pointer text-left"
              >
                <h3 className="font-semibold">{content.title}</h3>
                <p className="text-sm text-slate-500">Clique para editar</p>
              </button>

              <button
                type="button"
                onClick={() => void deleteContent(content.id)}
                className="mt-2 text-xs text-red-500"
              >
                Excluir conteúdo
              </button>
            </div>
          ))
        )}
      </div>

      {editing ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[600px] rounded-xl bg-white p-6 space-y-3">
            <h2 className="text-lg font-semibold">Editar conteúdo</h2>

            <input
              value={editing.title}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  title: e.target.value,
                })
              }
              className="w-full rounded border p-2"
            />

            <textarea
              value={editing.description ?? ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  description: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="Descrição"
            />

            <textarea
              value={editing.objectives ?? ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  objectives: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="Objetivos"
            />

            <textarea
              value={editing.methodology ?? ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  methodology: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="Metodologia"
            />

            <textarea
              value={editing.resources ?? ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  resources: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="Recursos"
            />

            <textarea
              value={editing.bncc ?? ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  bncc: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="BNCC"
            />

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => void deleteContent(editing.id)}
                className="rounded bg-red-600 px-4 py-2 text-white"
              >
                Excluir
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded border px-4 py-2"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void updateContent()}
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
