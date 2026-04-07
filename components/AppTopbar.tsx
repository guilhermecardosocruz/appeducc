"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AlertsModal from "./AlertsModal";

type Props = {
  userName?: string | null;
  userEmail?: string | null;
};

type AlertItem = {
  classId: string;
  className: string;
  schoolName: string;
  students: {
    studentId: string;
    studentName: string;
    frequency: number;
  }[];
};

export default function AppTopbar({ userName, userEmail }: Props) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AlertItem | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setAlerts(data);
      } catch {}
    };

    fetchAlerts();
  }, []);

  return (
    <header className="border-b bg-white/90 backdrop-blur relative">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-sky-700">
            EDUCC
          </Link>
          <p className="text-xs text-slate-500">
            {userName ?? "Usuário"}
            {userEmail ? ` • ${userEmail}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* ALERTS */}
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="relative inline-flex items-center rounded-md border px-3 py-2 text-sm"
            >
              🔔 Avisos

              {alerts.length > 0 && (
                <span className="ml-2 rounded-full bg-red-600 px-2 text-xs text-white">
                  {alerts.length}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-[90vw] max-w-sm rounded-md border bg-white shadow-lg z-50">
                <div className="border-b px-3 py-2 font-semibold text-sm">
                  Avisos
                </div>

                {alerts.length === 0 && (
                  <p className="px-3 py-3 text-sm text-slate-500">
                    Nenhum aviso no momento.
                  </p>
                )}

                <div className="max-h-80 overflow-auto">
                  {alerts.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(a)}
                      className="w-full text-left border-b px-3 py-3 hover:bg-slate-50"
                    >
                      <p className="font-medium text-sm">{a.schoolName}</p>
                      <p className="text-xs text-slate-500">
                        {a.className}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {a.students.length} aluno(s) com faltas consecutivas
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/perfil" className="border px-3 py-2 text-sm rounded-md">
            Minha conta
          </Link>

          <form method="POST" action="/api/auth/logout">
            <button className="border px-3 py-2 text-sm rounded-md">
              Sair
            </button>
          </form>
        </div>
      </div>

      {selected && (
        <AlertsModal alert={selected} onClose={() => setSelected(null)} />
      )}
    </header>
  );
}
