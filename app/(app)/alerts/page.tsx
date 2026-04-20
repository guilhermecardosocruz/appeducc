"use client";

import { useEffect, useState } from "react";

type AlertItem = {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  frequency: number;
};

type Grouped = {
  key: string;
  classId: string;
  className: string;
  schoolName: string;
  consecutiveAbsences: number;
  students: AlertItem[];
  isRead: boolean;
};

export default function AlertsPage() {
  const [groups, setGroups] = useState<Grouped[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/alerts", { cache: "no-store" });
    if (!res.ok) return;

    const data = await res.json();
    setGroups(data.groups || []);
    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      await load();
    }

    init();
  }, []);

  async function toggleRead(group: Grouped) {
    await Promise.all(
      group.students.map((s) =>
        fetch("/api/alerts/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId: group.classId,
            studentId: s.studentId,
          }),
        })
      )
    );

    await load();
    window.dispatchEvent(new Event("alerts-updated"));
  }

  async function remove(group: Grouped) {
    const confirmed = confirm(
      `Excluir ${group.students.length} aluno(s)?`
    );
    if (!confirmed) return;

    await Promise.all(
      group.students.map((s) =>
        fetch("/api/alerts/dismiss", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId: group.classId,
            studentId: s.studentId,
          }),
        })
      )
    );

    await load();
    window.dispatchEvent(new Event("alerts-updated"));
  }

  function copy(group: Grouped) {
    const text = `Escola: ${group.schoolName}
Turma: ${group.className}

Alunos com ${group.consecutiveAbsences} faltas:
${group.students
  .map((s) => `- ${s.studentName} (${s.frequency}%)`)
  .join("\n")}`;

    navigator.clipboard.writeText(text);
  }

  if (loading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="p-4 space-y-4">
      {groups.map((group) => (
        <div
          key={group.key}
          className={`border rounded-2xl p-4 space-y-3 ${
            group.isRead ? "bg-gray-100" : "bg-white"
          }`}
        >
          <div>
            <div className="font-semibold">{group.schoolName}</div>
            <div className="text-sm text-gray-500">
              {group.className}
            </div>
          </div>

          <div>
            <div className="text-red-600 font-medium mb-1">
              {group.consecutiveAbsences} faltas consecutivas
            </div>

            <ul className="text-sm space-y-1">
              {group.students.map((s) => (
                <li key={s.id}>
                  - {s.studentName} ({s.frequency}%)
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <button
              onClick={() => copy(group)}
              className="px-3 py-2 rounded-lg bg-gray-100"
            >
              📋 Copiar
            </button>

            <button
              onClick={() => toggleRead(group)}
              className="px-3 py-2 rounded-lg bg-blue-100"
            >
              ✔️ {group.isRead ? "Desfazer" : "Marcar como lido"}
            </button>

            <button
              onClick={() => remove(group)}
              className="px-3 py-2 rounded-lg bg-red-100"
            >
              🗑️ Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
