"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SchoolReport = {
  schoolId: string;
  schoolName: string;
  classes: number;
  students: number;
  presences: number;
  absences: number;
  presenceRate: number;
};

type Summary = {
  schools: number;
  classes: number;
  students: number;
  presences: number;
  absences: number;
  presenceRate: number;
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

  useEffect(() => {
    async function load() {
      const resolved = await params;
      setGroupId(resolved.groupId);

      const res = await fetch(
        `/api/groups/${resolved.groupId}/reports/schools`,
        { cache: "no-store" }
      );
      const json = await res.json();
      setData(json.schools);
      setSummary(json.summary);
      setLoading(false);
    }

    void load();
  }, [params]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para o grupo
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">
          Relatório do Grupo
        </h1>

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
              </div>
            )}

            <div className="mt-8 rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Escola</th>
                    <th className="px-4 py-3 text-left">Turmas</th>
                    <th className="px-4 py-3 text-left">Alunos</th>
                    <th className="px-4 py-3 text-left">Presenças</th>
                    <th className="px-4 py-3 text-left">Faltas</th>
                    <th className="px-4 py-3 text-left">% Presença</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.schoolId} className="border-t">
                      <td className="px-4 py-3">{row.schoolName}</td>
                      <td className="px-4 py-3">{row.classes}</td>
                      <td className="px-4 py-3">{row.students}</td>
                      <td className="px-4 py-3">{row.presences}</td>
                      <td className="px-4 py-3">{row.absences}</td>
                      <td className="px-4 py-3 font-medium">
                        {row.presenceRate}%
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
