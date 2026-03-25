"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type SchoolReport = {
  schoolId: string;
  schoolName: string;
  classes: number;
  students: number;
  totalAttendances: number;
  presences: number;
  absences: number;
  presenceRate: number;
  avgPresencesPerAttendance: number;
  avgAbsencesPerAttendance: number;
};

type Summary = {
  schools: number;
  classes: number;
  students: number;
  totalAttendances: number;
  presences: number;
  absences: number;
  presenceRate: number;
  avgPresencesPerAttendance: number;
  avgAbsencesPerAttendance: number;
  startDate: string | null;
  endDate: string | null;
};

export default function GroupReportsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const [data, setData] = useState<SchoolReport[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadReport = useCallback(
    async (
      nextGroupId: string,
      nextStartDate?: string,
      nextEndDate?: string
    ) => {
      setLoading(true);

      const search = new URLSearchParams();
      if (nextStartDate) search.set("startDate", nextStartDate);
      if (nextEndDate) search.set("endDate", nextEndDate);

      const query = search.toString();
      const url = `/api/groups/${nextGroupId}/reports/schools${
        query ? `?${query}` : ""
      }`;

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      setData(Array.isArray(json.schools) ? json.schools : []);
      setSummary(json.summary ?? null);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    async function init() {
      const resolved = await params;
      setGroupId(resolved.groupId);
      await loadReport(resolved.groupId, "", "");
    }

    void init();
  }, [params, loadReport]);

  async function handleApplyPeriod() {
    if (!groupId) return;
    await loadReport(groupId, startDate, endDate);
  }

  const pdfHref = useMemo(() => {
    const query = new URLSearchParams();
    if (startDate) query.set("startDate", startDate);
    if (endDate) query.set("endDate", endDate);

    const queryString = query.toString();
    return `/groups/${groupId}/reports/pdf${queryString ? `?${queryString}` : ""}`;
  }, [groupId, startDate, endDate]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para o grupo
          </Link>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">
            Relatório do Grupo
          </h1>

          <Link
            href={pdfHref}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
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
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
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
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleApplyPeriod()}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
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
                  <p className="text-xs text-slate-500">Escolas</p>
                  <p className="text-xl font-semibold">{summary.schools}</p>
                </div>

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
                    <th className="px-4 py-3 text-left">Escola</th>
                    <th className="px-4 py-3 text-left">Turmas</th>
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
                    <tr key={row.schoolId} className="border-t">
                      <td className="px-4 py-3">{row.schoolName}</td>
                      <td className="px-4 py-3">{row.classes}</td>
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
