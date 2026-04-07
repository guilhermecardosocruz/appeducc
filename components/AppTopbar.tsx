"use client";

import Link from "next/link";
import PwaInstallButton from "./PwaInstallButton";
import { useEffect, useState } from "react";

type Props = {
  userName?: string | null;
  userEmail?: string | null;
};

type AlertItem = {
  type: "ABSENCE_STREAK";
  studentName: string;
  className: string;
  message: string;
  severity: "high" | "medium" | "low";
};

export default function AppTopbar({ userName, userEmail }: Props) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setAlerts(data);
      } catch {
        // silencioso
      }
    };

    fetchAlerts();
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur relative">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-[0.18em] text-sky-700"
          >
            EDUCC
          </Link>

          {(userName || userEmail) && (
            <p className="mt-1 truncate text-xs text-slate-500">
              {userName ? userName : "Usuário"}
              {userEmail ? ` • ${userEmail}` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 relative">
          {/* 🔔 AVISOS */}
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              🔔 Avisos

              {alerts.length > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">
                  {alerts.length}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-80 rounded-md border bg-white shadow-lg z-50">
                <div className="border-b px-3 py-2 font-semibold text-sm">
                  Avisos
                </div>

                <div className="max-h-80 overflow-auto">
                  {alerts.length === 0 && (
                    <p className="px-3 py-3 text-sm text-slate-500">
                      Nenhum aviso no momento.
                    </p>
                  )}

                  {alerts.map((a, i) => (
                    <div
                      key={i}
                      className="border-b px-3 py-3 text-sm hover:bg-slate-50"
                    >
                      <p className="font-medium text-slate-800">
                        {a.studentName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {a.className}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {a.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/perfil"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Minha conta
          </Link>

          <div className="hidden sm:block">
            <div className="w-[190px]">
              <PwaInstallButton />
            </div>
          </div>

          <form method="POST" action="/api/auth/logout">
            <button
              type="submit"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Sair
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 sm:hidden">
        <div className="mx-auto max-w-6xl">
          <PwaInstallButton />
        </div>
      </div>
    </header>
  );
}
