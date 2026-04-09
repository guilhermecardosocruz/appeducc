"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AlertItem = {
  classId: string;
  className: string;
  schoolName: string;
  students: {
    studentId: string;
    studentName: string;
    frequency: number;
  }[];
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAlerts = async () => {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setAlerts(data);
      setLoading(false);
    };

    fetchAlerts();
  }, []);

  const copyMessage = (item: AlertItem) => {
    const text = `
Escola: ${item.schoolName}
Turma: ${item.className}

Alunos com faltas consecutivas:
${item.students.map(s => `- ${s.studentName} (${s.frequency}%)`).join("\n")}
    `;
    navigator.clipboard.writeText(text);
    window.alert("Mensagem copiada!");
  };

  if (loading) {
    return <p className="p-4 text-sm">Carregando avisos...</p>;
  }

  return (
    <div className="mx-auto max-w-4xl p-4">

      {/* BOTÃO VOLTAR */}
      <button
        onClick={() => {
          if (window.history.length > 1) router.back();
          else router.push("/dashboard");
        }}
        className="mb-4 text-sm text-sky-700"
      >
        ← Voltar
      </button>

      <h1 className="text-lg font-semibold mb-4">
        ⚠️ Avisos importantes
      </h1>

      {alerts.length === 0 && (
        <p className="text-sm text-slate-500">
          Nenhum aviso no momento.
        </p>
      )}

      <div className="space-y-4">
        {alerts.map((a, i) => (
          <div key={i} className="rounded-lg border p-4 bg-white shadow-sm">
            <p className="font-semibold">{a.schoolName}</p>
            <p className="text-sm text-slate-500">{a.className}</p>

            <p className="text-sm text-red-600 mt-2">
              {a.students.length} aluno(s) com faltas consecutivas
            </p>

            <div className="mt-3 space-y-2">
              {a.students.map((s) => (
                <div key={s.studentId} className="rounded border px-3 py-2 bg-slate-50">
                  <p className="font-medium text-sm">{s.studentName}</p>
                  <p className="text-xs text-slate-500">
                    Frequência: {s.frequency}%
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => copyMessage(a)}
                className="rounded-md border px-3 py-1 text-sm"
              >
                Copiar mensagem
              </button>

              <button
                onClick={() => {
                  setAlerts((prev) => prev.filter((_, index) => index !== i));
                }}
                className="rounded-md border px-3 py-1 text-sm text-red-600"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
