"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Content = {
  id: string;
  title: string;
  objectives: string | null;
  methodology: string | null;
  resources: string | null;
  bncc: string | null;
};

export default function ClassAiHelpPage() {
  const params = useParams();
  const classId = params.classId as string;

  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContentId, setSelectedContentId] = useState("");
  const [content, setContent] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function loadContents() {
    const res = await fetch(`/api/classes/${classId}/contents`, {
      cache: "no-store",
    });

    if (!res.ok) return;

    const data = await res.json();
    setContents(data);
  }

  useEffect(() => {
    void loadContents();
  }, []);

  function handleSelectContent(id: string) {
    setSelectedContentId(id);

    const selected = contents.find((c) => c.id === id);
    if (!selected) return;

    const fullText = `
Título: ${selected.title}

Objetivos:
${selected.objectives ?? "-"}

Metodologia:
${selected.methodology ?? "-"}

Recursos:
${selected.resources ?? "-"}

BNCC:
${selected.bncc ?? "-"}
`;

    setContent(fullText);
  }

  async function handleGenerate() {
    if (!content || !action) {
      alert("Preencha o conteúdo e selecione a ação.");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao gerar resposta.");
        return;
      }

      setResult(data.result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href={`/classes/${classId}`}
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          ← Voltar para turma
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            Ajuda com IA
          </h1>

          {/* SELECT CONTEÚDOS */}
          <select
            value={selectedContentId}
            onChange={(e) => handleSelectContent(e.target.value)}
            className="w-full rounded border p-3"
          >
            <option value="">Selecionar conteúdo existente</option>
            {contents.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* TEXTAREA */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ou escreva manualmente..."
            className="w-full rounded border p-3 min-h-[180px]"
          />

          {/* AÇÕES */}
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded border p-3"
          >
            <option value="">Selecione uma ação</option>
            <option value="Crie 3 atividades lúdicas para ensinar esse conteúdo">
              3 atividades lúdicas
            </option>
            <option value="Crie uma atividade desplugada para esse conteúdo">
              Atividade desplugada
            </option>
            <option value="Explique esse conteúdo de forma simples para alunos">
              Explicação simplificada
            </option>
            <option value="Crie um plano de aula com base nesse conteúdo">
              Plano de aula
            </option>
            <option value="Crie uma avaliação com 5 questões">
              Avaliação
            </option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded bg-sky-600 px-4 py-3 text-white disabled:opacity-60"
          >
            {loading ? "Gerando..." : "Gerar com IA"}
          </button>

          {result && (
            <div className="mt-4 rounded border p-4 bg-slate-50 whitespace-pre-wrap">
              {result}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
