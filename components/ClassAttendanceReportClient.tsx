"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StudentReport = {
  studentId: string;
  name: string;
  presences: number;
  absences: number;
  presenceRate: number;
};

type Summary = {
  classId: string;
  className: string;
  totalStudents: number;
  totalAttendances: number;
  totalPresences: number;
  totalAbsences: number;
  presenceRate: number;
};

export default function ClassAttendanceReportClient({
  classId,
}: {
  classId: string;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [students, setStudents] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/classes/${classId}/reports/attendance`, {
        cache: "no-store",
      });

      const json = await res.json();
      setSummary(json.summary);
      setStudents(Array.isArray(json.students) ? json.students : []);
      setLoading(false);
    }

    void load();
  }, [classId]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <Link
            href={`/classes/${classId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para turma
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">
          Relatório de Chamadas
        </h1>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Carregando relatório…</p>
        ) : (
          <>
            {summary ? (
              <>
                <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {summary.className}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Visão geral de presença da turma.
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-xs text-slate-500">Alunos</p>
                      <p className="text-xl font-semibold">
                        {summary.totalStudents}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-xs text-slate-500">Chamadas</p>
                      <p className="text-xl font-semibold">
                        {summary.totalAttendances}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-xs text-slate-500">Presenças</p>
                      <p className="text-xl font-semibold">
                        {summary.totalPresences}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-xs text-slate-500">Faltas</p>
                      <p className="text-xl font-semibold">
                        {summary.totalAbsences}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-xs text-slate-500">% Presença</p>
                      <p className="text-xl font-semibold">
                        {summary.presenceRate}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Presença por aluno
                    </h2>
                  </div>

                  {students.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-slate-500">
                      Nenhum aluno ativo encontrado para esta turma.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left">Aluno</th>
                          <th className="px-4 py-3 text-left">Presenças</th>
                          <th className="px-4 py-3 text-left">Faltas</th>
                          <th className="px-4 py-3 text-left">% Presença</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr
                            key={student.studentId}
                            className="border-t border-slate-200"
                          >
                            <td className="px-4 py-3">{student.name}</td>
                            <td className="px-4 py-3">{student.presences}</td>
                            <td className="px-4 py-3">{student.absences}</td>
                            <td className="px-4 py-3 font-medium">
                              {student.presenceRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">
                  Não foi possível carregar o relatório da turma.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
