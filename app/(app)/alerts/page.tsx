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

  // ✅ CORREÇÃO AQUI
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

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="p-4 space-y-4">
      {grouped.map((group) => (
        <div
          key={group.key}
          className="border rounded-xl p-4 space-y-2 bg-white shadow"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold">{group.schoolName}</div>
              <div className="text-sm text-gray-500">
                {group.className}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => copy(group)}>Copiar</button>
              <button onClick={() => markAsRead(group)}>Lido</button>
              <button onClick={() => remove(group)}>Excluir</button>
            </div>
          </div>

          <div className="text-sm">
            Alunos com {group.count} faltas consecutivas:
          </div>

          <ul className="text-sm">
            {group.students.map((s) => (
              <li key={s.id}>
                - {s.studentName} ({s.frequency}%)
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
