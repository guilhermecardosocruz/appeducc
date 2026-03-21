import Link from "next/link";
import PwaInstallButton from "./PwaInstallButton";

type Props = {
  userName?: string | null;
  userEmail?: string | null;
};

export default function AppTopbar({ userName, userEmail }: Props) {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-[0.18em] text-sky-700"
          >
            EDUCC
          </Link>

          {(userName || userEmail) && (
            <p className="mt-1 truncate text-xs text-slate-500">
              {userName ? userName : "Usuário"}
              {userEmail ? ` • ${userEmail}` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/perfil"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Minha conta
          </Link>

          <div className="hidden sm:block">
            <div className="w-[190px]">
              <PwaInstallButton />
            </div>
          </div>

          <form method="POST" action="/api/auth/logout">
            <button
              type="submit"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Sair
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 sm:hidden">
        <div className="mx-auto max-w-6xl">
          <PwaInstallButton />
        </div>
      </div>
    </header>
  );
}
