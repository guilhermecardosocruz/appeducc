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

  async function reload() {
    const res = await fetch("/api/alerts", { cache: "no-store" });
    if (!res.ok) return;

    const data: AlertItem[] = await res.json();
    setAlerts(data);
  }

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      if (!res.ok) return;

      const data: AlertItem[] = await res.json();
      setAlerts(data);
    }

    void fetchData();
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

  async function markGroupAsRead(g: Grouped) {
    for (const s of g.students) {
      await fetch("/api/alerts/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: s.classId,
          studentId: s.studentId,
        }),
      });
    }
    await reload();
  }

  async function dismissGroup(g: Grouped) {
    for (const s of g.students) {
      await fetch("/api/alerts/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: s.classId,
          studentId: s.studentId,
        }),
      });
    }
    await reload();
  }

  function copyGroup(g: Grouped) {
    const text = `Escola: ${g.schoolName}
Turma: ${g.className}

${g.consecutiveAbsences} faltas consecutivas:
${g.students
  .map((s) => `- ${s.studentName} (${s.frequency}%)`)
  .join("\n")}`;

    navigator.clipboard.writeText(text);
  }

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      <h1 className="text-lg font-semibold">⚠️ Avisos</h1>

      {grouped.map((g) => {
        const allRead = g.students.every((s) => s.isRead);

        return (
          <div
            key={`${g.classId}-${g.consecutiveAbsences}`}
            className={`border p-4 rounded space-y-2 ${
              allRead ? "bg-gray-100" : ""
            }`}
          >
            <p className="font-semibold">{g.schoolName}</p>
            <p className="text-sm">{g.className}</p>

            <p className="text-red-600 font-semibold mt-2">
              {g.consecutiveAbsences} faltas consecutivas
            </p>

            <button
              onClick={() => copyGroup(g)}
              className="border px-3 py-1 text-sm"
            >
              Copiar lista
            </button>

            <div className="text-sm mt-2">
              {g.students.map((s) => (
                <div key={s.id}>
                  - {s.studentName} ({s.frequency}%)
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              {!allRead && (
                <button
                  onClick={() => markGroupAsRead(g)}
                  className="border px-3 py-1 text-sm"
                >
                  Marcar como lido
                </button>
              )}

              <button
                onClick={() => dismissGroup(g)}
                className="border px-3 py-1 text-sm text-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
