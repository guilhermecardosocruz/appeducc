"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  userName?: string | null;
  userEmail?: string | null;
};

export default function AppTopbar({ userName, userEmail }: Props) {
  const [count, setCount] = useState(0);

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
    <header className="border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 py-3">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-sky-700">
            EDUCC
          </Link>
          <p className="text-xs text-slate-500">
            {userName ?? "Usuário"}
            {userEmail ? ` • ${userEmail}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
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
    </header>
  );
}
