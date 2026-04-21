"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type GroupReport = {
  groupId: string;
  groupName: string;
  schools: number;
  classes: number;
  students: number;
  totalAttendances: number;
  presences: number;
  absences: number;
  presenceRate: number;
};

export default function DashboardGroupsReportPage() {
  const [data, setData] = useState<GroupReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/dashboard/reports/groups", {
        cache: "no-store",
      });

      const json = await res.json();
      setData(json);
      setLoading(false);
    }

    void load();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-sm text-sky-700">
          ← Voltar
        </Link>

        <h1 className="text-2xl font-semibold mt-4">
          Relatório Geral (Grupos)
        </h1>

        {loading ? (
          <p className="mt-6">Carregando...</p>
        ) : (
          <table className="mt-6 w-full bg-white border text-sm">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Escolas</th>
                <th>Turmas</th>
                <th>Alunos</th>
                <th>Chamadas</th>
                <th>Presenças</th>
                <th>Faltas</th>
                <th>% Presença</th>
              </tr>
            </thead>
            <tbody>
              {data.map((g) => (
                <tr key={g.groupId}>
                  <td>{g.groupName}</td>
                  <td>{g.schools}</td>
                  <td>{g.classes}</td>
                  <td>{g.students}</td>
                  <td>{g.totalAttendances}</td>
                  <td>{g.presences}</td>
                  <td>{g.absences}</td>
                  <td>{g.presenceRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
