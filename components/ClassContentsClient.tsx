"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Content = {
  id: string;
  title: string;
  objectives: string | null;
  methodology: string | null;
  resources: string | null;
  bncc: string | null;
  createdAt?: string;
};

type Props = {
  classId: string;
  initialContents: Content[];
  canManageClass: boolean;
};

export default function ClassContentsClient({
  classId,
  initialContents,
  canManageClass,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [contents, setContents] = useState<Content[]>(initialContents);
  const [openForm, setOpenForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [methodology, setMethodology] = useState("");
  const [resources, setResources] = useState("");
  const [bncc, setBncc] = useState("");

  const [editingContent, setEditingContent] = useState<Content | null>(null);

  async function refreshContents() {
    const res = await fetch(`/api/classes/${classId}/contents`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) return;

    const data = await res.json();
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

      const data = await res.json();

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
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateContent() {
    if (!editingContent) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/classes/${classId}/contents/${editingContent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingContent.title,
          objectives: editingContent.objectives,
          methodology: editingContent.methodology,
          resources: editingContent.resources,
          bncc: editingContent.bncc,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao atualizar conteúdo.");
        return;
      }

      setEditingContent(null);
      await refreshContents();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteContent(id: string) {
    if (!confirm("Tem certeza que deseja excluir este conteúdo?")) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/classes/${classId}/contents/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao excluir conteúdo.");
        return;
      }

      if (editingContent?.id === id) {
        setEditingContent(null);
      }

      await refreshContents();
      router.refresh();
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

      const res = await fetch(`/api/classes/${classId}/contents/import`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao importar planilha.");
        return;
      }

      await refreshContents();
      router.refresh();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      alert(`${data?.imported ?? 0} conteúdo(s) importado(s).`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Conteúdos</h1>

        {canManageClass && (
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
              onClick={() => setOpenForm(!openForm)}
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
        )}
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

      {openForm && canManageClass && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome da aula"
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
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-1 md:grid-cols-3">
        {contents.map((content) => (
          <div
            key={content.id}
            className="rounded-lg border p-4 transition hover:bg-slate-50"
          >
            <button
              type="button"
              onClick={() => setEditingContent(content)}
              className="w-full cursor-pointer text-left"
            >
              <h3 className="font-semibold">{content.title}</h3>
              <p className="text-sm text-slate-500">Clique para editar</p>
            </button>

            {canManageClass ? (
              <button
                type="button"
                onClick={() => void handleDeleteContent(content.id)}
                className="mt-2 text-xs text-red-500"
              >
                Excluir conteúdo
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {editingContent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[600px] rounded-xl bg-white p-6 space-y-3">
            <h2 className="text-lg font-semibold">Editar conteúdo</h2>

            <input
              value={editingContent.title}
              onChange={(e) =>
                setEditingContent({
                  ...editingContent,
                  title: e.target.value,
                })
              }
              className="w-full rounded border p-2"
            />

            <textarea
              value={editingContent.objectives ?? ""}
              onChange={(e) =>
                setEditingContent({
                  ...editingContent,
                  objectives: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="Objetivos"
            />

            <textarea
              value={editingContent.methodology ?? ""}
              onChange={(e) =>
                setEditingContent({
                  ...editingContent,
                  methodology: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="Metodologia"
            />

            <textarea
              value={editingContent.resources ?? ""}
              onChange={(e) =>
                setEditingContent({
                  ...editingContent,
                  resources: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="Recursos"
            />

            <textarea
              value={editingContent.bncc ?? ""}
              onChange={(e) =>
                setEditingContent({
                  ...editingContent,
                  bncc: e.target.value,
                })
              }
              className="w-full rounded border p-2"
              placeholder="BNCC"
            />

            <div className="flex justify-between">
              {canManageClass ? (
                <button
                  type="button"
                  onClick={() => void handleDeleteContent(editingContent.id)}
                  className="rounded bg-red-600 px-4 py-2 text-white"
                >
                  Excluir
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingContent(null)}
                  className="rounded border px-4 py-2"
                >
                  Cancelar
                </button>
                {canManageClass ? (
                  <button
                    type="button"
                    onClick={() => void handleUpdateContent()}
                    disabled={loading}
                    className="rounded bg-sky-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Salvando..." : "Salvar"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
