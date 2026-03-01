import Link from "next/link";

export default function RecoverPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <h1 className="text-sm font-semibold tracking-[0.2em] text-sky-400">
            EDUCC
          </h1>
          <p className="mt-2 text-2xl font-semibold">Recuperar senha</p>
          <p className="mt-1 text-sm text-slate-400">
            Informe o e-mail cadastrado para receber um link de redefinição.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-sky-500/5">
          <form className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-200"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                placeholder="nome@escola.com.br"
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Enviar link de recuperação
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Lembrou a senha?{" "}
            <Link
              href="/login"
              className="font-medium text-sky-400 hover:text-sky-300"
            >
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
