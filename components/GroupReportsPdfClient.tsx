"use client";

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
    }

    void load();
  }, [groupId, startDate, endDate]);

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">
        Relatório por Turma (Agrupado por Escola)
      </h1>

      {data.map((school) => (
        <div key={school.schoolId} className="mt-6">
          <h2 className="font-bold">{school.schoolName}</h2>

          <table className="w-full border mt-2 text-sm">
            <thead>
              <tr>
                <th className="border px-2">Turma</th>
                <th className="border px-2">Alunos</th>
                <th className="border px-2">Chamadas</th>
                <th className="border px-2">% Presença</th>
                <th className="border px-2">Média P</th>
                <th className="border px-2">Média F</th>
              </tr>
            </thead>
            <tbody>
              {school.classes.map((cls) => (
                <tr key={cls.classId}>
                  <td className="border px-2">{cls.className}</td>
                  <td className="border px-2">{cls.students}</td>
                  <td className="border px-2">{cls.totalAttendances}</td>
                  <td className="border px-2">{cls.presenceRate}%</td>
                  <td className="border px-2">
                    {cls.avgPresencesPerAttendance}
                  </td>
                  <td className="border px-2">
                    {cls.avgAbsencesPerAttendance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </main>
  );
}
