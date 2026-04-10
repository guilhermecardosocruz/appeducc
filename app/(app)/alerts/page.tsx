"use client";

import { useEffect, useMemo, useState } from "react";

type AlertItem = {
  id: string;
  classId: string;
  className: string;
  schoolName: string;
  studentId: string;
  studentName: string;
  frequency: number;
  consecutiveAbsences: number;
  isRead: boolean;
};

type Grouped = {
  classId: string;
  className: string;
  schoolName: string;
  consecutiveAbsences: number;
  students: AlertItem[];
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    async function fetchAlerts() {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      if (!res.ok) return;

      const data: AlertItem[] = await res.json();
      setAlerts(data);
    }

    void fetchAlerts();
  }, []);

  const grouped: Grouped[] = useMemo(() => {
    const map = new Map<string, Grouped>();

    for (const a of alerts) {
      const key = `${a.classId}-${a.consecutiveAbsences}`;

      if (!map.has(key)) {
        map.set(key, {
          classId: a.classId,
          className: a.className,
          schoolName: a.schoolName,
          consecutiveAbsences: a.consecutiveAbsences,
          students: [],
        });
      }

      map.get(key)!.students.push(a);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.consecutiveAbsences - a.consecutiveAbsences
    );
  }, [alerts]);

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      <h1 className="text-lg font-semibold">⚠️ Avisos</h1>

      {grouped.map((g) => (
        <div key={`${g.classId}-${g.consecutiveAbsences}`} className="border p-4 rounded">
          <p className="font-semibold">{g.schoolName}</p>
          <p className="text-sm">{g.className}</p>

          <p className="text-red-600 mt-2 font-semibold">
            {g.consecutiveAbsences} faltas consecutivas
          </p>

          <div className="mt-2 text-sm">
            {g.students.map((s) => (
              <div key={s.id}>
                - {s.studentName} ({s.frequency}%)
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
