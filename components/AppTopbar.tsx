"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  userName?: string | null;
  userEmail?: string | null;
};

export default function AppTopbar({ userName, userEmail }: Props) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.length);
    };

    fetchAlerts();
  }, []);

  return (
    <>
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 py-3">

          {/* ESQUERDA */}
          <div>
            <Link href="/dashboard" className="text-sm font-semibold text-sky-700">
              EDUCC
            </Link>
            <p className="text-xs text-slate-500 hidden sm:block">
              {userName ?? "Usuário"}
              {userEmail ? ` • ${userEmail}` : ""}
            </p>
          </div>

          {/* DIREITA */}
          <div className="flex items-center gap-2">

            {/* ☰ MOBILE (AGORA À DIREITA) */}
            <button
              onClick={() => setOpen(true)}
              className="relative md:hidden text-xl"
            >
              ☰

              {/* 🔴 BADGE (inferior esquerda) */}
              {count > 0 && (
                <span className="absolute bottom-0 left-0 h-3 w-3 rounded-full bg-red-600" />
              )}
            </button>

            {/* DESKTOP MENU */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/alerts"
                className="relative inline-flex items-center rounded-md border px-3 py-2 text-sm"
              >
                🔔 Avisos

                {count > 0 && (
                  <span className="ml-2 rounded-full bg-red-600 px-2 text-xs text-white">
                    {count}
                  </span>
                )}
              </Link>

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
        </div>
      </header>

      {/* DRAWER */}
      {open && (
        <div className="fixed inset-0 z-50 flex">

          {/* OVERLAY */}
          <div
            className="flex-1 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* MENU */}
          <div className="w-64 bg-white shadow-xl p-4 flex flex-col gap-3">

            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            <Link
              href="/alerts"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span>🔔 Avisos</span>
              {count > 0 && (
                <span className="rounded-full bg-red-600 px-2 text-xs text-white">
                  {count}
                </span>
              )}
            </Link>

            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="rounded-md border px-3 py-2"
            >
              Minha conta
            </Link>

            <form method="POST" action="/api/auth/logout">
              <button className="w-full text-left rounded-md border px-3 py-2">
                Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
