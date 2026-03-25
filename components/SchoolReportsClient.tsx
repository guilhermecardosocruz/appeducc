"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ClassReport = {
  classId: string;
  className: string;
  students: number;
  totalAttendances: number;
  presences: number;
  absences: number;
  presenceRate: number;
  avgPresencesPerAttendance: number;
  avgAbsencesPerAttendance: number;
};

type Summary = {
  classes: number;
  students: number;
  totalAttendances: number;
  presences: number;
  absences: number;
  presenceRate: number;
  avgPresencesPerAttendance: number;
  avgAbsencesPerAttendance: number;
};

export default function SchoolReportsClient({
  schoolId,
}: {
  schoolId: string;
}) {
  const [data, setData] = useState<ClassReport[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      const res = await fetch(`/api/schools/${schoolId}/reports/classes`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!active) return;

      setData(Array.isArray(json.classes) ? json.classes : []);
      setSummary(json.summary ?? null);
      setLoading(false);
    }

    void initialLoad();

    return () => {
      active = false;
    };
  }, [schoolId]);

  async function handleApplyPeriod() {
    setLoading(true);

    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const query = params.toString();
    const res = await fetch(
      `/api/schools/${schoolId}/reports/classes${query ? `?${query}` : ""}`,
      { cache: "no-store" }
    );

    const json = await res.json();
    setData(Array.isArray(json.classes) ? json.classes : []);
    setSummary(json.summary ?? null);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <Link
            href={`/schools/${schoolId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para escola
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">
          Relatório da Escola
        </h1>

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
            {summary && (
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-slate-500">Turmas</p>
                  <p className="text-xl font-semibold">{summary.classes}</p>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-slate-500">Alunos</p>
                  <p className="text-xl font-semibold">{summary.students}</p>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-slate-500">Chamadas</p>
                  <p className="text-xl font-semibold">
                    {summary.totalAttendances}
                  </p>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-slate-500">Presenças</p>
                  <p className="text-xl font-semibold">{summary.presences}</p>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-slate-500">Faltas</p>
                  <p className="text-xl font-semibold">{summary.absences}</p>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-slate-500">% Presença</p>
                  <p className="text-xl font-semibold">
                    {summary.presenceRate}%
                  </p>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-slate-500">
                    Média presenças/chamada
                  </p>
                  <p className="text-xl font-semibold">
                    {summary.avgPresencesPerAttendance}
                  </p>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-slate-500">
                    Média faltas/chamada
                  </p>
                  <p className="text-xl font-semibold">
                    {summary.avgAbsencesPerAttendance}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Turma</th>
                    <th className="px-4 py-3 text-left">Alunos</th>
                    <th className="px-4 py-3 text-left">Chamadas</th>
                    <th className="px-4 py-3 text-left">Presenças</th>
                    <th className="px-4 py-3 text-left">Faltas</th>
                    <th className="px-4 py-3 text-left">% Presença</th>
                    <th className="px-4 py-3 text-left">Média P/Chamada</th>
                    <th className="px-4 py-3 text-left">Média F/Chamada</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.classId} className="border-t">
                      <td className="px-4 py-3">{row.className}</td>
                      <td className="px-4 py-3">{row.students}</td>
                      <td className="px-4 py-3">{row.totalAttendances}</td>
                      <td className="px-4 py-3">{row.presences}</td>
                      <td className="px-4 py-3">{row.absences}</td>
                      <td className="px-4 py-3 font-medium">
                        {row.presenceRate}%
                      </td>
                      <td className="px-4 py-3">
                        {row.avgPresencesPerAttendance}
                      </td>
                      <td className="px-4 py-3">
                        {row.avgAbsencesPerAttendance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
