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
  latestLessonDate: string;
};

type Grouped = {
  classId: string;
  className: string;
  schoolName: string;
  consecutiveAbsences: number;
  latestLessonDate: string;
  students: AlertItem[];
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

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
          latestLessonDate: a.latestLessonDate,
          students: [],
        });
      }

      const current = map.get(key)!;
      current.students.push(a);

      if (
        new Date(a.latestLessonDate).getTime() >
        new Date(current.latestLessonDate).getTime()
      ) {
        current.latestLessonDate = a.latestLessonDate;
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.latestLessonDate).getTime() -
        new Date(a.latestLessonDate).getTime()
    );
  }, [alerts]);

  async function markGroupAsRead(g: Grouped) {
    for (const s of g.students) {
      await fetch("/api/alerts/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: s.classId,
          studentId: s.studentId,
        }),
      });
    }

    window.location.reload();
  }

  async function dismissGroup(g: Grouped) {
    for (const s of g.students) {
      await fetch("/api/alerts/dismiss", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: s.classId,
          studentId: s.studentId,
        }),
      });
    }

    window.location.reload();
  }

  function copyGroup(g: Grouped) {
    const text = `Escola: ${g.schoolName}
Turma: ${g.className}

Alunos com faltas consecutivas:
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
            className={`rounded border p-4 space-y-3 ${
              allRead ? "bg-gray-100" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{g.schoolName}</p>
                <p className="text-sm">{g.className}</p>
              </div>

              <button
                onClick={() => copyGroup(g)}
                className="rounded border px-3 py-1 text-sm"
              >
                Copiar lista
              </button>
            </div>

            <p className="font-semibold text-red-600">
              {g.consecutiveAbsences} faltas consecutivas
            </p>

            <div className="text-sm space-y-1">
              {g.students.map((s) => (
                <div key={s.id}>
                  - {s.studentName} ({s.frequency}%)
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              {!allRead && (
                <button
                  onClick={() => markGroupAsRead(g)}
                  className="rounded border px-3 py-1 text-sm"
                >
                  Marcar como lido
                </button>
              )}

              <button
                onClick={() => dismissGroup(g)}
                className="rounded border px-3 py-1 text-sm text-red-600"
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
