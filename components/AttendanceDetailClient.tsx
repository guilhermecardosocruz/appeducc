"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type PresenceItem = {
  id: string;
  present: boolean;
  student: {
    id: string;
    name: string;
  };
};

type Props = {
  attendanceId: string;
  classId: string;
  initialTitle: string;
  initialPresences: PresenceItem[];
};

export default function AttendanceDetailClient({
  attendanceId,
  classId,
  initialTitle,
  initialPresences,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [presences, setPresences] = useState<PresenceItem[]>(initialPresences);
  const [loading, setLoading] = useState(false);

  const summary = useMemo(() => {
    const total = presences.length;
    const presents = presences.filter((item) => item.present).length;
    return { total, presents, absents: total - presents };
  }, [presences]);

  function togglePresence(id: string) {
    setPresences((current) =>
      current.map((item) =>
        item.id === id ? { ...item, present: !item.present } : item
      )
    );
  }

  async function handleSave() {
    setLoading(true);

    try {
      const res = await fetch(`/api/attendances/${attendanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          presences: presences.map((item) => ({
            id: item.id,
            present: item.present,
          })),
        }),
      });

      if (!res.ok) {
        console.error("Erro ao salvar chamada");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar chamada", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Título da chamada
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {summary.total}
              </p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Presentes
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {summary.presents}
              </p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Faltas
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {summary.absents}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Presenças</h2>
        <p className="mt-2 text-sm text-slate-500">
          Marque quem está presente nesta chamada.
        </p>

        {presences.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            Ainda não há alunos cadastrados nesta turma.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {presences.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {item.student.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.present ? "Presente" : "Faltou"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => togglePresence(item.id)}
                  className={[
                    "rounded-md px-4 py-2 text-sm font-medium transition",
                    item.present
                      ? "bg-sky-600 text-white hover:bg-sky-700"
                      : "bg-slate-200 text-slate-800 hover:bg-slate-300",
                  ].join(" ")}
                >
                  {item.present ? "Presente" : "Marcar presença"}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-between gap-3">
          <a
            href={`/classes/${classId}/chamadas`}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Voltar
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar chamada"}
          </button>
        </div>
      </div>
    </div>
  );
}
