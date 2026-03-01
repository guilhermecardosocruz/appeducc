import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-xl px-6 text-center">
        <h1 className="text-sm font-semibold tracking-[0.2em] text-sky-400">
          EDUCC
        </h1>

        <p className="mt-3 text-3xl font-semibold">
          Organização simples da sua vida escolar
        </p>

        <p className="mt-3 text-sm text-slate-400">
          Crie escolas, conecte coordenadores, organize turmas e acompanhe o
          trabalho dos professores em uma única plataforma.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
          >
            Entrar na plataforma
          </Link>

          <span className="text-xs text-slate-500">
            Primeira versão ainda em desenvolvimento.
          </span>
        </div>
      </div>
    </main>
  );
}
