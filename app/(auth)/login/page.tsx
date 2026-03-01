import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Topbar simples */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="text-sm font-semibold tracking-[0.18em] text-sky-700">
            EDUCC
          </div>
          <nav className="hidden gap-6 text-xs text-slate-500 sm:flex">
            <span className="font-medium text-slate-700">Dashboard</span>
            <span>Minhas escolas</span>
            <span>Ajuda</span>
          </nav>
        </div>
      </header>

      {/* Conteúdo central */}
      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            PWA em desenvolvimento para escolas
          </span>

          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Bem-vindo de volta
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Acesse sua conta para continuar organizando escolas, turmas e
              equipes pedagógicas.
            </p>
          </div>
        </div>

        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200 sm:p-7">
            {/* Botão Google (stub por enquanto) */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <span className="text-lg">G</span>
              <span>Entrar com Google</span>
            </button>

            {/* Divider */}
            <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>ou entre com e-mail</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Formulário */}
            <form className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-800"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="voce@exemplo.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-800"
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-sky-600 hover:text-sky-500"
                  >
                    Mostrar senha
                  </button>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Digite sua senha"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <Link
                  href="/recover"
                  className="font-medium text-sky-600 hover:text-sky-500"
                >
                  Esqueci minha senha
                </Link>
                <Link
                  href="/register"
                  className="font-medium text-sky-600 hover:text-sky-500"
                >
                  Criar conta
                </Link>
              </div>

              <button
                type="submit"
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/40 transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
              >
                Entrar
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            EDUCC • Primeira versão da plataforma educacional em desenvolvimento
          </p>
        </div>
      </section>
    </main>
  );
}
