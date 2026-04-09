"use client";

import { useEffect, useState } from "react";

type AlertItem = {
  id: string;
  schoolName: string;
  className: string;
  studentName: string;
  isRead: boolean;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  async function load() {
    const res = await fetch("/api/alerts", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setAlerts(data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function markAsRead(id: string) {
    await fetch(`/api/alerts/${id}`, { method: "PATCH" });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    load();
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
            {a.studentName} com faltas consecutivas
          </p>

          <div className="flex gap-2 mt-3">
            {!a.isRead && (
              <button
                onClick={() => markAsRead(a.id)}
                className="border px-3 py-1 text-sm"
              >
                Marcar como lido
              </button>
            )}

            <button
              onClick={() => remove(a.id)}
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
