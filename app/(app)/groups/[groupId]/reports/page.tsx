"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
};

export default function GroupReportsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const [data, setData] = useState<SchoolReport[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
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

      setData(json.schools ?? []);
      setSummary(json.summary ?? null);
    }

    void load();
  }, [params]);

  const pdfHref = useMemo(() => {
    return `/groups/${groupId}/reports/pdf`;
  }, [groupId]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex justify-between items-center">
          <Link href={`/groups/${groupId}`}>← Voltar</Link>

          <Link
            href={pdfHref}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Gerar PDF
          </Link>
        </div>

        <h1 className="text-2xl font-semibold mt-4">
          Relatório por Turma (Agrupado por Escola)
        </h1>

        {summary && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded border">
              <p className="text-xs">Escolas</p>
              <p className="text-lg font-semibold">{summary.schools}</p>
            </div>

            <div className="bg-white p-4 rounded border">
              <p className="text-xs">Turmas</p>
              <p className="text-lg font-semibold">{summary.classes}</p>
            </div>

            <div className="bg-white p-4 rounded border">
              <p className="text-xs">Alunos</p>
              <p className="text-lg font-semibold">{summary.students}</p>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {data.map((school) => (
            <div key={school.schoolId} className="bg-white p-4 rounded border">
              <h2 className="text-lg font-bold mb-4">
                {school.schoolName}
              </h2>

              {school.classes.map((cls) => (
                <div
                  key={cls.classId}
                  className="bg-slate-50 border rounded px-4 py-3 flex flex-wrap md:flex-nowrap gap-4 justify-between text-sm"
                >
                  <span className="font-medium">
                    {cls.className}
                  </span>

                  <span>Alunos: {cls.students}</span>

                  <span>Chamadas: {cls.totalAttendances}</span>

                  <span>
                    Presença:{" "}
                    <span className="text-green-600 font-medium">
                      {cls.presenceRate}%
                    </span>
                  </span>

                  <span>Média P: {cls.avgPresencesPerAttendance}</span>

                  <span className="text-red-600">
                    Média F: {cls.avgAbsencesPerAttendance}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
