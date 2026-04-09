"use client";

import { useEffect, useState } from "react";

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

  async function reload() {
    const res = await fetch("/api/alerts", { cache: "no-store" });
    if (!res.ok) return;

    const data: AlertItem[] = await res.json();
    setAlerts(data);
  }

  async function markAsRead(a: AlertItem) {
    await fetch("/api/alerts/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId: a.classId,
        studentId: a.studentId,
      }),
    });

    await reload();
  }

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      <h1 className="text-lg font-semibold">⚠️ Avisos</h1>

      {alerts.map((a) => (
        <div
          key={a.id}
          className={`border p-4 rounded ${
            a.isRead ? "bg-gray-100" : "bg-white"
          }`}
        >
          <p className="font-semibold">{a.schoolName}</p>
          <p className="text-sm">{a.className}</p>
          <p className="text-red-600 text-sm mt-2">
            {a.studentName} ({a.frequency}%) com faltas consecutivas
          </p>

          <div className="flex gap-2 mt-3">
            {!a.isRead && (
              <button
                onClick={() => markAsRead(a)}
                className="border px-3 py-1 text-sm"
              >
                Marcar como lido
              </button>
            )}

            <button
              onClick={() => dismiss(a)}
              className="border px-3 py-1 text-sm text-red-600"
            >
              Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
