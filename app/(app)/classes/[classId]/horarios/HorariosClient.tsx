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
      <div className="mx-auto w-full max-w-6xl">

        {/* BOTÃO VOLTAR */}
        <div className="mb-6">
          <Link
            href={`/classes/${classId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para turma
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">Horários</h1>

        <div className="grid grid-cols-5 gap-4 mt-6">
          {days.map((day, i) => (
            <div key={day} className="bg-white p-4 border rounded">
              <h2 className="font-semibold mb-2">{day}</h2>

              {data
                .filter((d) => d.dayOfWeek === i + 1)
                .map((item) => (
                  <div key={item.id} className="mb-2 p-3 bg-sky-100 rounded">

                    {/* ESCOLA */}
                    <div className="text-xs text-slate-500">
                      {item.schoolName}
                    </div>

                    {/* PERÍODO */}
                    <div className="text-sm font-semibold">
                      {item.period}
                    </div>

                    {/* HORÁRIO */}
                    <div className="text-xs">
                      {item.startTime} - {item.endTime}
                    </div>

                    {/* PROFESSOR */}
                    {item.teacherName && (
                      <div className="text-xs text-slate-500 mt-1">
                        Professor: {item.teacherName}
                      </div>
                    )}

                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
