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

type Props = {
  groupId: string;
};

function GroupReportsClient({ groupId }: Props) {
  const [data, setData] = useState<SchoolReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/groups/${groupId}/reports/schools`, {
        cache: "no-store",
      });
      const json = await res.json();
      setData(json);
      setLoading(false);
    }

    void load();
  }, [groupId]);

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
          Relatório de Frequência por Escola
        </h1>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Carregando relatório…</p>
        ) : (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
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
                  <tr key={row.schoolId} className="border-t border-slate-200">
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
        )}
      </div>
    </main>
  );
}

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupReportsPage({ params }: PageProps) {
  const { groupId } = await params;
  return <GroupReportsClient groupId={groupId} />;
}
