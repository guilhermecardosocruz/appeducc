"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StudentReport = {
  studentId: string;
  name: string;
  presences: number;
  absences: number;
  presenceRate: number;
  missedLessons: number[];
};

type Summary = {
  classId: string;
  className: string;
  totalStudents: number;
  totalAttendances: number;
  totalPresences: number;
  totalAbsences: number;
  presenceRate: number;
  avgPresencesPerAttendance: number;
  avgAbsencesPerAttendance: number;
  startDate: string | null;
  endDate: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Todo o período";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatMissedLessons(missedLessons: number[]) {
  if (!Array.isArray(missedLessons) || missedLessons.length === 0) {
    return "-";
  }

  return missedLessons.map((lesson) => `${lesson}°`).join(", ");
}

export default function ClassAttendanceReportPdfClient({
  classId,
  startDate,
  endDate,
}: {
  classId: string;
  startDate: string;
  endDate: string;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [students, setStudents] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const query = params.toString();
      const res = await fetch(
        `/api/classes/${classId}/reports/attendance${query ? `?${query}` : ""}`,
        { cache: "no-store" }
      );

      const json = await res.json();

      if (!active) return;

      setSummary(json.summary ?? null);
      setStudents(Array.isArray(json.students) ? json.students : []);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [classId, startDate, endDate]);

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-card {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            break-inside: avoid;
          }

          table {
            break-inside: auto;
          }

          tr {
            break-inside: avoid;
            break-after: auto;
          }
        }
      `}</style>

      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="print-container mx-auto w-full max-w-5xl">
          <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/classes/${classId}/relatorio-chamadas${
                startDate || endDate
                  ? `?${new URLSearchParams({
                      ...(startDate ? { startDate } : {}),
                      ...(endDate ? { endDate } : {}),
                    }).toString()}`
                  : ""
              }`}
              className="text-sm font-medium text-sky-700 hover:text-sky-800"
            >
              ← Voltar para relatório
            </Link>

            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Imprimir / Salvar em PDF
            </button>
          </div>

          {loading ? (
            <div className="print-card rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-500">Carregando relatório…</p>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              <section className="print-card rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                      EDUCC
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                      Relatório de Chamadas da Turma
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                      Turma: <span className="font-medium">{summary.className}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Período:{" "}
                      <span className="font-medium">
                        {formatDate(summary.startDate)} até {formatDate(summary.endDate)}
                      </span>
                    </p>
                  </div>

                  <div className="text-right text-xs text-slate-500">
                    <p>Gerado em</p>
                    <p>{new Date().toLocaleDateString("pt-BR")}</p>
                    <p>{new Date().toLocaleTimeString("pt-BR")}</p>
                  </div>
                </div>
              </section>

              <section className="print-card rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Resumo</h2>

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Alunos</p>
                    <p className="text-xl font-semibold">{summary.totalStudents}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Chamadas</p>
                    <p className="text-xl font-semibold">{summary.totalAttendances}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Presenças</p>
                    <p className="text-xl font-semibold">{summary.totalPresences}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Faltas</p>
                    <p className="text-xl font-semibold">{summary.totalAbsences}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">% Presença</p>
                    <p className="text-xl font-semibold">{summary.presenceRate}%</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Média presentes/aula</p>
                    <p className="text-xl font-semibold">
                      {summary.avgPresencesPerAttendance}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Média ausentes/aula</p>
                    <p className="text-xl font-semibold">
                      {summary.avgAbsencesPerAttendance}
                    </p>
                  </div>
                </div>
              </section>

              <section className="print-card rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Presença por aluno
                  </h2>
                </div>

                {students.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-slate-500">
                    Nenhum aluno ativo encontrado para esta turma.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-6 py-3 text-left">Aluno</th>
                        <th className="px-6 py-3 text-left">Presenças</th>
                        <th className="px-6 py-3 text-left">Faltas</th>
                        <th className="px-6 py-3 text-left">Aulas que faltou</th>
                        <th className="px-6 py-3 text-left">% Presença</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr
                          key={student.studentId}
                          className="border-t border-slate-200"
                        >
                          <td className="px-6 py-3">{student.name}</td>
                          <td className="px-6 py-3">{student.presences}</td>
                          <td className="px-6 py-3">{student.absences}</td>
                          <td className="px-6 py-3">
                            {formatMissedLessons(student.missedLessons)}
                          </td>
                          <td className="px-6 py-3 font-medium">
                            {student.presenceRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>
          ) : (
            <div className="print-card rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-500">
                Não foi possível carregar o relatório.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
