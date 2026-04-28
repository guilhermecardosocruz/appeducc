"use client";

import { useEffect, useState } from "react";

type Props = {
  userName: string;
  userEmail: string;
};

export default function AppTopbar({ userName, userEmail }: Props) {
  const [count, setCount] = useState(0);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

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
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b relative">
      {/* ESQUERDA */}
      <div>
        <div className="font-bold text-sm">EDUCC</div>
        <div className="text-xs text-gray-500">
          {userName} • {userEmail}
        </div>
      </div>

      {/* DESKTOP MENU */}
      <div className="hidden md:flex items-center gap-4">
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

      {/* MOBILE MENU BUTTON */}
      <button
        className="md:hidden text-xl"
        onClick={() => setOpenMenu((v) => !v)}
      >
        ☰
      </button>

      {/* MOBILE DROPDOWN */}
      {openMenu && (
        <div className="absolute right-4 top-14 w-56 bg-white border rounded-lg shadow-md p-3 flex flex-col gap-3 md:hidden z-50">
          <a href="/dashboard" onClick={() => setOpenMenu(false)}>
            🏠 Início
          </a>

          <a href="/alerts" onClick={() => setOpenMenu(false)}>
            🔔 Avisos ({count})
          </a>

          <a href="/perfil" onClick={() => setOpenMenu(false)}>
            Minha conta
          </a>

          <button
            onClick={handleLogout}
            className="text-left text-red-600"
          >
            {loadingLogout ? "Saindo..." : "Sair"}
          </button>
        </div>
      )}
    </div>
  );
}
