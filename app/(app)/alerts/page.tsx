"use client";

import { useEffect, useState, useMemo } from "react";

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
  key: string;
  className: string;
  schoolName: string;
  count: number;
  students: AlertItem[];
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      setAlerts(data.alerts || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  const grouped: Grouped[] = useMemo(() => {
    const map = new Map<string, Grouped>();

    for (const alert of alerts) {
      const key = `${alert.classId}-${alert.consecutiveAbsences}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          className: alert.className,
          schoolName: alert.schoolName,
          count: alert.consecutiveAbsences,
          students: [],
        });
      }

      map.get(key)!.students.push(alert);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.students.length - a.students.length
    );
  }, [alerts]);

  async function markAsRead(group: Grouped) {
    await Promise.all(
      group.students.map((s) =>
        fetch(`/api/alerts/${s.id}/read`, { method: "POST" })
      )
    );

    setAlerts((prev) =>
      prev.map((a) =>
        group.students.find((s) => s.id === a.id)
          ? { ...a, isRead: true }
          : a
      )
    );
  }

  async function remove(group: Grouped) {
    await Promise.all(
      group.students.map((s) =>
        fetch(`/api/alerts/${s.id}`, { method: "DELETE" })
      )
    );

    setAlerts((prev) =>
      prev.filter((a) => !group.students.find((s) => s.id === a.id))
    );
  }

  function copy(group: Grouped) {
    const text = `Escola: ${group.schoolName}
Turma: ${group.className}

Alunos com ${group.count} faltas consecutivas:
${group.students
  .map((s) => `- ${s.studentName} (${s.frequency}%)`)
  .join("\n")}`;

    navigator.clipboard.writeText(text);
  }

  if (loading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="p-4 space-y-4">
      {grouped.map((group) => (
        <div
          key={group.key}
          className="border rounded-2xl p-4 bg-white shadow-sm space-y-3"
        >
          {/* Header */}
          <div>
            <div className="font-semibold text-base">
              {group.schoolName}
            </div>
            <div className="text-sm text-gray-500">
              {group.className}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="text-sm">
            <div className="font-medium text-red-600 mb-1">
              {group.count} faltas consecutivas
            </div>

            <ul className="space-y-1">
              {group.students.map((s) => (
                <li key={s.id}>
                  - {s.studentName} ({s.frequency}%)
                </li>
              ))}
            </ul>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <button
              onClick={() => copy(group)}
              className="w-full sm:w-auto px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
            >
              📋 Copiar
            </button>

            <button
              onClick={() => markAsRead(group)}
              className="w-full sm:w-auto px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm"
            >
              ✔️ Marcar como lido
            </button>

            <button
              onClick={() => remove(group)}
              className="w-full sm:w-auto px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-sm"
            >
              🗑️ Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
