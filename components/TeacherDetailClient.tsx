"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type LinkedClass = {
  id: string;
  name: string;
  year: number | null;
  school: {
    id: string;
    name: string;
    group: {
      id: string;
      name: string;
    };
  };
};

type AvailableClass = {
  id: string;
  name: string;
  year: number | null;
  school: {
    id: string;
    name: string;
    group: {
      id: string;
      name: string;
    };
  };
};

type Props = {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  linkedClasses: LinkedClass[];
  availableClasses: AvailableClass[];
};

export default function TeacherDetailClient({
  teacherId,
  teacherName,
  teacherEmail,
  linkedClasses,
  availableClasses,
}: Props) {
  const [currentLinked, setCurrentLinked] = useState(linkedClasses);
  const [currentAvailable, setCurrentAvailable] = useState(availableClasses);
  const [loadingAssignId, setLoadingAssignId] = useState<string | null>(null);
  const [loadingRemoveId, setLoadingRemoveId] = useState<string | null>(null);

  const sortedAvailable = useMemo(
    () =>
      [...currentAvailable].sort((a, b) => {
        const groupCompare = a.school.group.name.localeCompare(b.school.group.name);
        if (groupCompare !== 0) return groupCompare;

        const schoolCompare = a.school.name.localeCompare(b.school.name);
        if (schoolCompare !== 0) return schoolCompare;

        return a.name.localeCompare(b.name);
      }),
    [currentAvailable]
  );

  async function assignClass(classId: string) {
    setLoadingAssignId(classId);

    try {
      const res = await fetch(`/api/teachers/${teacherId}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      });

      if (!res.ok) {
        console.error("Erro ao vincular turma");
        return;
      }

      const data = (await res.json()) as {
        linkedClasses: LinkedClass[];
        availableClasses: AvailableClass[];
      };

      setCurrentLinked(data.linkedClasses);
      setCurrentAvailable(data.availableClasses);
    } catch (error) {
      console.error("Erro ao vincular turma", error);
    } finally {
      setLoadingAssignId(null);
    }
  }

  async function removeClass(classId: string) {
    setLoadingRemoveId(classId);

    try {
      const res = await fetch(`/api/teachers/${teacherId}/classes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      });

      if (!res.ok) {
        console.error("Erro ao remover vínculo da turma");
        return;
      }

      const data = (await res.json()) as {
        linkedClasses: LinkedClass[];
        availableClasses: AvailableClass[];
      };

      setCurrentLinked(data.linkedClasses);
      setCurrentAvailable(data.availableClasses);
    } catch (error) {
      console.error("Erro ao remover vínculo da turma", error);
    } finally {
      setLoadingRemoveId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para dashboard
          </Link>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            {teacherName}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{teacherEmail}</p>
          <p className="mt-3 text-sm text-slate-500">
            Vincule e remova turmas deste professor. As permissões de acesso
            serão refletidas conforme as turmas atendidas.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Turmas vinculadas
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Estas turmas estão atualmente atribuídas a este professor.
            </p>

            {currentLinked.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                Nenhuma turma vinculada ainda.
              </p>
            ) : (
              <ul className="mt-6 space-y-3">
                {currentLinked.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md border border-slate-200 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.year ? `Ano letivo ${item.year} • ` : ""}
                          {item.school.group.name} • {item.school.name}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeClass(item.id)}
                        disabled={loadingRemoveId === item.id}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {loadingRemoveId === item.id
                          ? "Removendo..."
                          : "Remover"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Turmas disponíveis
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Selecione uma turma disponível para vincular a este professor.
            </p>

            {sortedAvailable.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                Não há turmas disponíveis para vínculo no momento.
              </p>
            ) : (
              <ul className="mt-6 space-y-3">
                {sortedAvailable.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md border border-slate-200 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.year ? `Ano letivo ${item.year} • ` : ""}
                          {item.school.group.name} • {item.school.name}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => assignClass(item.id)}
                        disabled={loadingAssignId === item.id}
                        className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                      >
                        {loadingAssignId === item.id
                          ? "Vinculando..."
                          : "Vincular"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
