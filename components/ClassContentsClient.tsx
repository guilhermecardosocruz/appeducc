"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [contents, setContents] = useState<ContentItem[]>(initialContents);
  const [openForm, setOpenForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [methodology, setMethodology] = useState("");
  const [resources, setResources] = useState("");
  const [bncc, setBncc] = useState("");

  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);

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

    await fetch(`/api/classes/${classId}/contents/${editingContent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingContent),
    });

    setEditingContent(null);
    await refreshContents();
    router.refresh();
  }

  async function handleDeleteContent(id: string) {
    if (!confirm("Tem certeza que deseja excluir este conteúdo?")) return;

    await fetch(`/api/classes/${classId}/contents/${id}`, {
      method: "DELETE",
    });

    await refreshContents();
    router.refresh();
  }

  async function handleImportFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Envie um arquivo .xlsx.");
      return;
    }

    setImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/classes/${classId}/contents/import`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      await refreshContents();
      router.refresh();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      alert(`${data.imported ?? 0} conteúdo(s) importado(s).`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">Conteúdos</h1>

        {canManageClass && (
          <div className="flex gap-2">
            <a
              href="/templates/contents-template.xlsx"
              className="border px-3 py-2 rounded"
            >
              Modelo Excel
            </a>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="border px-3 py-2 rounded"
            >
              Importar Excel
            </button>

            <button
              onClick={() => setOpenForm(!openForm)}
              className="bg-sky-600 text-white px-3 py-2 rounded"
            >
              Novo conteúdo
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
              }}
            />
          </div>
        )}
      </div>

      {openForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome da aula"
            className="w-full border p-2 rounded"
          />
          <textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder="Objetivos"
            className="w-full border p-2 rounded"
          />
          <textarea
            value={methodology}
            onChange={(e) => setMethodology(e.target.value)}
            placeholder="Metodologia"
            className="w-full border p-2 rounded"
          />
          <textarea
            value={resources}
            onChange={(e) => setResources(e.target.value)}
            placeholder="Recursos"
            className="w-full border p-2 rounded"
          />
          <textarea
            value={bncc}
            onChange={(e) => setBncc(e.target.value)}
            placeholder="BNCC"
            className="w-full border p-2 rounded"
          />

          <button className="bg-sky-600 text-white px-4 py-2 rounded">
            Salvar
          </button>
        </form>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-3 sm:grid-cols-1">
        {contents.map((content) => (
          <div
            key={content.id}
            className="border rounded-lg p-4 cursor-pointer hover:bg-slate-50"
            onClick={() => setEditingContent(content)}
          >
            <h3 className="font-semibold">{content.title}</h3>
            <p className="text-sm text-slate-500">Clique para editar</p>
            <button
              onClick={() => handleDeleteContent(content.id)}
              className="mt-2 text-red-500 text-xs"
            >
              Excluir conteúdo
            </button>
          </div>
        ))}
      </div>

      {editingContent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[600px] space-y-3">
            <h2 className="text-lg font-semibold">Editar conteúdo</h2>

            <input
              value={editingContent.title}
              onChange={(e) =>
                setEditingContent({
                  ...editingContent,
                  title: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
            />

            <textarea
              value={editingContent.objectives ?? ""}
              onChange={(e) =>
                setEditingContent({
                  ...editingContent,
                  objectives: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
            />

            <textarea
              value={editingContent.methodology ?? ""}
              onChange={(e) =>
                setEditingContent({
                  ...editingContent,
                  methodology: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
            />

            <textarea
              value={editingContent.resources ?? ""}
              onChange={(e) =>
                setEditingContent({
                  ...editingContent,
                  resources: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
            />

            <textarea
              value={editingContent.bncc ?? ""}
              onChange={(e) =>
                setEditingContent({
                  ...editingContent,
                  bncc: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
            />

            <div className="flex justify-between">
              <button
                onClick={() => handleDeleteContent(editingContent.id)}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Excluir
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingContent(null)}
                  className="border px-4 py-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateContent}
                  className="bg-sky-600 text-white px-4 py-2 rounded"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
