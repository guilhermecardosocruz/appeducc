"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Schedule = {
  id: string;
  dayOfWeek: number;
  period: string;
  startTime: string;
  endTime: string;
  schoolName: string;
  teacherName: string | null;
};

const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];

export default function HorariosClient({ classId }: { classId: string }) {
  const [data, setData] = useState<Schedule[]>([]);

  useEffect(() => {
    fetch(`/api/classes/${classId}/schedules`)
      .then((r) => r.json())
      .then((res: Schedule[]) => setData(res));
  }, [classId]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-7xl">

        {/* BOTÃO VOLTAR */}
        <div className="mb-6">
          <Link
            href={`/classes/${classId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para turma
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">
          Horários
        </h1>

        {/* 🔥 FIX RESPONSIVO (igual grupo) */}
        <div className="mt-8 overflow-x-auto">
          <div className="grid min-w-[980px] grid-cols-5 gap-4">

            {days.map((day, i) => (
              <div
                key={day}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-4 text-lg font-semibold text-slate-900">
                  {day}
                </div>

                {data
                  .filter((d) => d.dayOfWeek === i + 1)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="mb-3 rounded-md bg-sky-100 px-4 py-3"
                    >
                      {/* ESCOLA */}
                      <div className="text-xs text-slate-500">
                        {item.schoolName}
                      </div>

                      {/* PERÍODO */}
                      <div className="text-sm font-semibold text-slate-900">
                        {item.period}
                      </div>

                      {/* HORÁRIO */}
                      <div className="text-xs text-slate-700">
                        {item.startTime} - {item.endTime}
                      </div>

                      {/* PROFESSOR */}
                      {item.teacherName && (
                        <div className="mt-1 text-xs text-slate-500">
                          Professor: {item.teacherName}
                        </div>
                      )}
                    </div>
                  ))}

                {data.filter((d) => d.dayOfWeek === i + 1).length === 0 && (
                  <div className="text-xs text-slate-400">
                    Sem horários
                  </div>
                )}
              </div>
            ))}

          </div>
        </div>
      </div>
    </main>
  );
}
