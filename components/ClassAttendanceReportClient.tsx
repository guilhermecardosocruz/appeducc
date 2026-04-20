"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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

function formatMissedLessons(missedLessons: number[]) {
  if (!Array.isArray(missedLessons) || missedLessons.length === 0) {
    return "-";
  }

  return missedLessons.map((lesson) => `${lesson}°`).join(", ");
}

export default function ClassAttendanceReportClient({
  classId,
}: {
  classId: string;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [students, setStudents] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadReport = useCallback(
    async (nextStartDate?: string, nextEndDate?: string) => {
      setLoading(true);

      const params = new URLSearchParams();
      if (nextStartDate) params.append("startDate", nextStartDate);
      if (nextEndDate) params.append("endDate", nextEndDate);

      const query = params.toString();
      const res = await fetch(
        `/api/classes/${classId}/reports/attendance${query ? `?${query}` : ""}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json();
      setSummary(json.summary ?? null);
      setStudents(Array.isArray(json.students) ? json.students : []);
      setLoading(false);
    },
    [classId]
  );

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      const res = await fetch(`/api/classes/${classId}/reports/attendance`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!active) return;

      setSummary(json.summary ?? null);
      setStudents(Array.isArray(json.students) ? json.students : []);
      setLoading(false);
    }

    void initialLoad();

    return () => {
      active = false;
    };
  }, [classId]);

  async function handleApplyPeriod() {
    await loadReport(startDate, endDate);
  }

  const pdfHref = useMemo(() => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const query = params.toString();
    return `/classes/${classId}/relatorio-chamadas/pdf${query ? `?${query}` : ""}`;
  }, [classId, startDate, endDate]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <Link
            href={`/classes/${classId}/chamadas`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para chamadas
          </Link>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">
            Relatório de Chamadas
          </h1>

          <Link
            href={pdfHref}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Versão para PDF
          </Link>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Período do relatório
          </h2>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Fim
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleApplyPeriod()}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white"
            >
              Aplicar período
            </button>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Carregando relatório…</p>
        ) : (
          <>
            {summary ? (
              <>
                <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {summary.className}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Visão geral de presença da turma.
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-xs text-slate-500">Alunos</p>
                      <p className="text-xl font-semibold">
                        {summary.totalStudents}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-xs text-slate-500">Chamadas</p>
                      <p className="text-xl font-semibold">
                        {summary.totalAttendances}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-xs text-slate-500">Presenças</p>
                      <p className="text-xl font-semibold">
                        {summary.totalPresences}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-xs text-slate-500">Faltas</p>
                      <p className="text-xl font-semibold">
                        {summary.totalAbsences}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-xs text-slate-500">% Presença</p>
                      <p className="text-xl font-semibold">
                        {summary.presenceRate}%
                      </p>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-xs text-slate-500">
                        Média presentes/aula
                      </p>
                      <p className="text-xl font-semibold">
                        {summary.avgPresencesPerAttendance}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-xs text-slate-500">
                        Média ausentes/aula
                      </p>
                      <p className="text-xl font-semibold">
                        {summary.avgAbsencesPerAttendance}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Presença por aluno
                    </h2>
                  </div>

                  {students.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-slate-500">
                      Nenhum aluno ativo encontrado para esta turma.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left">Aluno</th>
                          <th className="px-4 py-3 text-left">Presenças</th>
                          <th className="px-4 py-3 text-left">Faltas</th>
                          <th className="px-4 py-3 text-left">
                            Aulas que faltou
                          </th>
                          <th className="px-4 py-3 text-left">% Presença</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr
                            key={student.studentId}
                            className="border-t border-slate-200"
                          >
                            <td className="px-4 py-3">{student.name}</td>
                            <td className="px-4 py-3">{student.presences}</td>
                            <td className="px-4 py-3">{student.absences}</td>
                            <td className="px-4 py-3">
                              {formatMissedLessons(student.missedLessons)}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {student.presenceRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">
                  Não foi possível carregar o relatório da turma.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
