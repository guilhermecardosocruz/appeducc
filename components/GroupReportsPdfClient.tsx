"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ClassReport = {
  classId: string;
  className: string;
  students: number;
  totalAttendances: number;
  presenceRate: number;
  avgPresencesPerAttendance: number;
  avgAbsencesPerAttendance: number;
};

type SchoolReport = {
  schoolId: string;
  schoolName: string;
  classes: ClassReport[];
};

type Summary = {
  schools: number;
  classes: number;
  students: number;
  totalAttendances: number;
  startDate: string | null;
  endDate: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Todo o período";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function GroupReportsPdfClient({
  groupId,
  startDate,
  endDate,
}: {
  groupId: string;
  startDate: string;
  endDate: string;
}) {
  const [data, setData] = useState<SchoolReport[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const query = params.toString();

      const res = await fetch(
        `/api/groups/${groupId}/reports/schools${query ? `?${query}` : ""}`,
        { cache: "no-store" }
      );

      const json = await res.json();

      setData(json.schools ?? []);
      setSummary(json.summary ?? null);
    }

    void load();
  }, [groupId, startDate, endDate]);

  const backHref = `/groups/${groupId}/reports`;

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none;
          }
          body {
            background: #fff !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-white px-8 py-8">
        <div className="no-print mb-6 flex justify-between">
          <Link
            href={backHref}
            className="text-sm font-medium text-sky-700"
          >
            ← Voltar
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded bg-sky-600 px-4 py-2 text-white"
          >
            Imprimir / Salvar em PDF
          </button>
        </div>

        <h1 className="text-2xl font-semibold">
          Relatório de Presença do Grupo
        </h1>

        {summary && (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Período: {formatDate(summary.startDate)} até{" "}
              {formatDate(summary.endDate)}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="border p-3">
                <p className="text-xs">Escolas</p>
                <p className="text-lg font-semibold">{summary.schools}</p>
              </div>

              <div className="border p-3">
                <p className="text-xs">Turmas</p>
                <p className="text-lg font-semibold">{summary.classes}</p>
              </div>

              <div className="border p-3">
                <p className="text-xs">Alunos</p>
                <p className="text-lg font-semibold">{summary.students}</p>
              </div>

              <div className="border p-3">
                <p className="text-xs">Chamadas</p>
                <p className="text-lg font-semibold">
                  {summary.totalAttendances}
                </p>
              </div>
            </div>
          </>
        )}

        {data.map((school) => (
          <div key={school.schoolId} className="mt-8">
            <h2 className="font-bold text-lg">{school.schoolName}</h2>

            <table className="w-full border mt-2 text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Turma</th>
                  <th className="border px-2 py-1">Alunos</th>
                  <th className="border px-2 py-1">Chamadas</th>
                  <th className="border px-2 py-1">% Presença</th>
                  <th className="border px-2 py-1">Média P</th>
                  <th className="border px-2 py-1">Média F</th>
                </tr>
              </thead>
              <tbody>
                {school.classes.map((cls) => (
                  <tr key={cls.classId}>
                    <td className="border px-2 py-1">{cls.className}</td>
                    <td className="border px-2 py-1">{cls.students}</td>
                    <td className="border px-2 py-1">
                      {cls.totalAttendances}
                    </td>
                    <td className="border px-2 py-1">
                      {cls.presenceRate}%
                    </td>
                    <td className="border px-2 py-1">
                      {cls.avgPresencesPerAttendance}
                    </td>
                    <td className="border px-2 py-1">
                      {cls.avgAbsencesPerAttendance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </main>
    </>
  );
}
