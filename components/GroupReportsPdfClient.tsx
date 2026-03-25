"use client";

import { useEffect, useState } from "react";

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
    let active = true;

    async function load() {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const query = params.toString();
      const res = await fetch(
        `/api/groups/${groupId}/reports/schools${query ? `?${query}` : ""}`,
        { cache: "no-store" }
      );

      const json = (await res.json()) as {
        schools?: SchoolReport[];
        summary?: Summary | null;
      };

      if (!active) return;

      setData(Array.isArray(json.schools) ? json.schools : []);
      setSummary(json.summary ?? null);
    }

    void load();

    return () => {
      active = false;
    };
  }, [groupId, startDate, endDate]);

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
        <div className="no-print mb-6">
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

            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>Escolas: {summary.schools}</div>
              <div>Turmas: {summary.classes}</div>
              <div>Alunos: {summary.students}</div>
              <div>Chamadas: {summary.totalAttendances}</div>
              <div>Presenças: {summary.presences}</div>
              <div>Faltas: {summary.absences}</div>
              <div>% Presença: {summary.presenceRate}%</div>
              <div>
                Média presenças/chamada: {summary.avgPresencesPerAttendance}
              </div>
              <div>
                Média faltas/chamada: {summary.avgAbsencesPerAttendance}
              </div>
            </div>
          </>
        )}

        <table className="mt-8 w-full border text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1">Escola</th>
              <th className="border px-2 py-1">Turmas</th>
              <th className="border px-2 py-1">Alunos</th>
              <th className="border px-2 py-1">Chamadas</th>
              <th className="border px-2 py-1">Presenças</th>
              <th className="border px-2 py-1">Faltas</th>
              <th className="border px-2 py-1">% Presença</th>
              <th className="border px-2 py-1">Média P/Chamada</th>
              <th className="border px-2 py-1">Média F/Chamada</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.schoolId}>
                <td className="border px-2 py-1">{row.schoolName}</td>
                <td className="border px-2 py-1">{row.classes}</td>
                <td className="border px-2 py-1">{row.students}</td>
                <td className="border px-2 py-1">{row.totalAttendances}</td>
                <td className="border px-2 py-1">{row.presences}</td>
                <td className="border px-2 py-1">{row.absences}</td>
                <td className="border px-2 py-1">{row.presenceRate}%</td>
                <td className="border px-2 py-1">
                  {row.avgPresencesPerAttendance}
                </td>
                <td className="border px-2 py-1">
                  {row.avgAbsencesPerAttendance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
}
