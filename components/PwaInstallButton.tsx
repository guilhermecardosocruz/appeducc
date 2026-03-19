"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(navigatorWithStandalone.standalone)
  );
}

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(() =>
    isInStandaloneMode()
  );
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Erro ao registrar service worker", error);
      });
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowIosHelp(false);
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const canUsePrompt = useMemo(
    () => !installed && Boolean(deferredPrompt),
    [installed, deferredPrompt]
  );

  async function handleInstall() {
    if (installed) return;

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    if (isIos()) {
      setShowIosHelp((current) => !current);
      return;
    }

    alert(
      "A instalação automática ainda não está disponível neste navegador. No menu do navegador, procure por 'Instalar app' ou 'Adicionar à tela inicial'."
    );
  }

  if (installed) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        App já instalado neste dispositivo.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void handleInstall()}
        className="inline-flex w-full items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
      >
        {canUsePrompt ? "Instalar no celular" : "Instalar no celular"}
      </button>

      {showIosHelp && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No iPhone/iPad, toque em <span className="font-semibold">Compartilhar</span> no Safari e depois em{" "}
          <span className="font-semibold">Adicionar à Tela de Início</span>.
        </div>
      )}
    </div>
  );
}
