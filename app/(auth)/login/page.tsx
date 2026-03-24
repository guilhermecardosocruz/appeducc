"use client";

import { useState } from "react";
import Link from "next/link";
import PwaInstallButton from "@/components/PwaInstallButton";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setError("E-mail ou senha incorretos");
      return;
    }

    router.push(data.redirect);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-10">
        
        {/* LOGO / TÍTULO */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            EDUCC
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Gestão educacional inteligente
          </p>
        </div>

        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-5">
              <PwaInstallButton />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-800">
                  E-mail
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-800">
                  Senha
                </label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-sky-600"
                >
                  {showPassword ? "Ocultar senha" : "Mostrar senha"}
                </button>

                <div className="flex gap-4">
                  <Link href="/recover" className="text-sky-600">
                    Esqueci minha senha
                  </Link>
                  <Link href="/register" className="text-sky-600">
                    Criar conta
                  </Link>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Entrar
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            EDUCC • Plataforma educacional
          </p>
        </div>
      </section>
    </main>
  );
}
