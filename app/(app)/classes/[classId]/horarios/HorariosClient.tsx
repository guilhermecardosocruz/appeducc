"use client";

import { useEffect, useState } from "react";

type Schedule = {
  id: string;
  dayOfWeek: number;
  period: string;
  startTime: string;
  endTime: string;
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
    <div className="p-6">
      <h1 className="text-xl font-bold">Horários</h1>

      <div className="grid grid-cols-5 gap-4 mt-6">
        {days.map((day, i) => (
          <div key={day} className="bg-white p-4 border rounded">
            <h2 className="font-semibold mb-2">{day}</h2>

            {data
              .filter((d) => d.dayOfWeek === i + 1)
              .map((item) => (
                <div key={item.id} className="mb-2 p-2 bg-sky-100 rounded">
                  <div className="text-sm font-semibold">{item.period}</div>
                  <div className="text-xs">
                    {item.startTime} - {item.endTime}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
