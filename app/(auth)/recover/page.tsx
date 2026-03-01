import Link from "next/link";

export default function RecoverPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 text-center">
          <h1 className="text-sm font-semibold tracking-[0.18em] text-sky-700">
            EDUCC
          </h1>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            Recuperar senha
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Informe o e-mail cadastrado para receber um link de redefinição.
          </p>
        </div>

        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200 sm:p-7">
          <form
            className="space-y-4"
            method="POST"
            action="/api/auth/recover"
          >
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
                placeholder="nome@escola.com.br"
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/40 transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
            >
              Enviar link de recuperação
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Lembrou a senha?{" "}
            <Link
              href="/login"
              className="font-medium text-sky-600 hover:text-sky-500"
            >
              Voltar para o login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
