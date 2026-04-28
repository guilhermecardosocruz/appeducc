"use client";

import { useEffect, useState } from "react";

type Props = {
  userName: string;
  userEmail: string;
};

export default function AppTopbar({ userName, userEmail }: Props) {
  const [count, setCount] = useState(0);
  const [loadingLogout, setLoadingLogout] = useState(false);

  async function loadAlertsCount() {
    const res = await fetch("/api/alerts", { cache: "no-store" });
    if (!res.ok) return;

    const data = await res.json();
    setCount(data.unreadCount || 0);
  }

  async function handleLogout() {
    setLoadingLogout(true);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!res.ok) {
        alert("Erro ao sair");
        return;
      }

      window.location.href = "/login";
    } finally {
      setLoadingLogout(false);
    }
  }

  useEffect(() => {
    setTimeout(() => {
      loadAlertsCount();
    }, 0);

    function handleUpdate() {
      loadAlertsCount();
    }

    window.addEventListener("alerts-updated", handleUpdate);

    return () => {
      window.removeEventListener("alerts-updated", handleUpdate);
    };
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
      {/* ESQUERDA */}
      <div>
        <div className="font-bold text-sm">EDUCC</div>
        <div className="text-xs text-gray-500">
          {userName} • {userEmail}
        </div>
      </div>

      {/* DIREITA */}
      <div className="flex items-center gap-4">
        <a href="/dashboard">🏠 Início</a>

        <a href="/alerts" className="relative">
          🔔 Avisos
          {count > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {count}
            </span>
          )}
        </a>

        <a href="/perfil">Minha conta</a>

        <button
          onClick={handleLogout}
          disabled={loadingLogout}
          className="text-red-600 text-sm hover:underline disabled:opacity-50"
        >
          {loadingLogout ? "Saindo..." : "Sair"}
        </button>
      </div>
    </div>
  );
}
