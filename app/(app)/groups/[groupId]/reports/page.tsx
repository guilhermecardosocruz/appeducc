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

export default function GroupReportsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const [data, setData] = useState<SchoolReport[]>([]);
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
    }

    void load();
  }, [params]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <Link href={`/groups/${groupId}`}>← Voltar</Link>

      <h1 className="text-2xl font-semibold mt-4">
        Relatório por Turma (Agrupado por Escola)
      </h1>

      <div className="mt-6 space-y-6">
        {data.map((school) => (
          <div key={school.schoolId} className="bg-white p-4 rounded border">
            <h2 className="text-lg font-bold mb-3">{school.schoolName}</h2>

            <div className="space-y-3">
              {school.classes.map((cls) => (
                <div
                  key={cls.classId}
                  className="border rounded p-3 bg-slate-50"
                >
                  <p className="font-semibold">{cls.className}</p>

                  <div className="text-sm mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <span>Alunos: {cls.students}</span>
                    <span>Chamadas: {cls.totalAttendances}</span>
                    <span>% Presença: {cls.presenceRate}%</span>
                    <span>Média P: {cls.avgPresencesPerAttendance}</span>
                    <span>Média F: {cls.avgAbsencesPerAttendance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
