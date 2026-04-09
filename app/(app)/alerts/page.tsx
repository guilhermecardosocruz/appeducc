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
  isRead: boolean;
};

type Grouped = {
  classId: string;
  className: string;
  schoolName: string;
  students: AlertItem[];
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("ALL");

  useEffect(() => {
    async function fetchAlerts() {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      if (!res.ok) return;

      const data: AlertItem[] = await res.json();
      setAlerts(data);
    }

    void fetchAlerts();
  }, []);

  async function reload() {
    const res = await fetch("/api/alerts", { cache: "no-store" });
    if (!res.ok) return;

    const data: AlertItem[] = await res.json();
    setAlerts(data);
  }

  async function markAsRead(a: AlertItem) {
    await fetch("/api/alerts/read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        classId: a.classId,
        studentId: a.studentId,
      }),
    });

    await reload();
  }

  async function dismiss(a: AlertItem) {
    await fetch("/api/alerts/dismiss", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        classId: a.classId,
        studentId: a.studentId,
      }),
    });

    await reload();
  }

  const grouped: Grouped[] = useMemo(() => {
    const map = new Map<string, Grouped>();

    for (const a of alerts) {
      if (!map.has(a.classId)) {
        map.set(a.classId, {
          classId: a.classId,
          className: a.className,
          schoolName: a.schoolName,
          students: [],
        });
      }

      map.get(a.classId)!.students.push(a);
    }

    return Array.from(map.values());
  }, [alerts]);

  const filtered = selectedClass === "ALL"
    ? grouped
    : grouped.filter((g) => g.classId === selectedClass);

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

      <select
        value={selectedClass}
        onChange={(e) => setSelectedClass(e.target.value)}
        className="border px-2 py-1"
      >
        <option value="ALL">Todas as turmas</option>
        {grouped.map((g) => (
          <option key={g.classId} value={g.classId}>
            {g.className}
          </option>
        ))}
      </select>

      {filtered.map((g) => (
        <div key={g.classId} className="border p-4 rounded space-y-2">
          <p className="font-semibold">{g.schoolName}</p>
          <p className="text-sm">{g.className}</p>

          <button
            onClick={() => copyGroup(g)}
            className="border px-3 py-1 text-sm"
          >
            Copiar lista
          </button>

          {g.students.map((s) => (
            <div
              key={s.id}
              className={`border p-2 rounded ${
                s.isRead ? "bg-gray-100" : ""
              }`}
            >
              <p className="text-sm">
                {s.studentName} ({s.frequency}%)
              </p>

              <div className="flex gap-2 mt-2">
                {!s.isRead && (
                  <button
                    onClick={() => markAsRead(s)}
                    className="border px-2 py-1 text-xs"
                  >
                    Lido
                  </button>
                )}

                <button
                  onClick={() => dismiss(s)}
                  className="border px-2 py-1 text-xs text-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
