"use client";

import { useEffect, useState } from "react";

type Params = {
  params: Promise<{
    groupId: string;
  }>;
};

type Item = {
  id: string;
  dayOfWeek: number;
  period: string;
  startTime: string;
  endTime: string;
  className: string;
};

const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];

export default function Page({ params }: Params) {
  const [groupId, setGroupId] = useState<string>("");
  const [data, setData] = useState<Item[]>([]);

  useEffect(() => {
    params.then((p) => {
      setGroupId(p.groupId);
    });
  }, [params]);

  useEffect(() => {
    if (!groupId) return;

    fetch(`/api/groups/${groupId}/schedules`)
      .then((r) => r.json())
      .then(setData);
  }, [groupId]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">Horários do Grupo</h1>

      <div className="grid grid-cols-5 gap-4">
        {days.map((day, i) => (
          <div key={day} className="border p-3 rounded bg-white">
            <h2 className="font-semibold mb-2">{day}</h2>

            {data
              .filter((d) => d.dayOfWeek === i + 1)
              .map((item) => (
                <div key={item.id} className="bg-sky-100 p-2 mb-2 rounded">
                  <p className="text-sm font-medium">{item.className}</p>
                  <p className="text-xs">
                    {item.startTime} - {item.endTime}
                  </p>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
