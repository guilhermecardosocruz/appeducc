"use client";

import { useState } from "react";

type Content = {
  id: string;
  title: string;
  description?: string;
  objectives?: string;
  methodology?: string;
  resources?: string;
  bncc?: string;
};

export default function GroupContentsClient({
  initialContents,
  groupId,
}: {
  initialContents: Content[];
  groupId: string;
}) {
  const [contents, setContents] = useState(initialContents);
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<Content | null>(null);

  async function createContent() {
    if (!title.trim()) return;

    const res = await fetch(`/api/groups/${groupId}/contents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (res.ok) {
      const newContent = await res.json();
      setContents([...contents, newContent]);
      setTitle("");
    }
  }

  async function updateContent() {
    if (!editing) return;

    const res = await fetch(
      `/api/groups/${groupId}/contents/${editing.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editing),
      }
    );

    if (res.ok) {
      setContents(
        contents.map((c) => (c.id === editing.id ? editing : c))
      );
      setEditing(null);
    }
  }

  async function deleteContent(id: string) {
    const confirmed = confirm("Excluir conteúdo?");
    if (!confirmed) return;

    const res = await fetch(
      `/api/groups/${groupId}/contents/${id}`,
      {
        method: "DELETE",
      }
    );

    if (res.ok) {
      setContents(contents.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="mt-6">
      <div className="flex gap-2">
        <input
          className="border px-3 py-2 rounded w-full"
          placeholder="Nome da aula"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          onClick={createContent}
          className="bg-sky-600 text-white px-4 py-2 rounded"
        >
          Adicionar
        </button>
      </div>

      <div className="mt-6 grid gap-3">
        {contents.map((c) => (
          <div
            key={c.id}
            onClick={() => setEditing(c)}
            className="cursor-pointer border bg-white p-3 rounded shadow-sm hover:bg-slate-50"
          >
            {c.title}
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">
              Editar conteúdo
            </h2>

            <input
              className="border px-3 py-2 rounded w-full mb-2"
              value={editing.title}
              onChange={(e) =>
                setEditing({ ...editing, title: e.target.value })
              }
            />

            <textarea
              className="border px-3 py-2 rounded w-full mb-2"
              placeholder="Objetivos"
              value={editing.objectives ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, objectives: e.target.value })
              }
            />

            <textarea
              className="border px-3 py-2 rounded w-full mb-2"
              placeholder="Metodologia"
              value={editing.methodology ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, methodology: e.target.value })
              }
            />

            <textarea
              className="border px-3 py-2 rounded w-full mb-2"
              placeholder="Recursos"
              value={editing.resources ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, resources: e.target.value })
              }
            />

            <textarea
              className="border px-3 py-2 rounded w-full mb-2"
              placeholder="BNCC"
              value={editing.bncc ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, bncc: e.target.value })
              }
            />

            <div className="flex justify-between mt-4">
              <button
                onClick={() => deleteContent(editing.id)}
                className="text-red-600"
              >
                Excluir
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 border rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={updateContent}
                  className="px-4 py-2 bg-sky-600 text-white rounded"
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
