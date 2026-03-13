"use client";

import Link from "next/link";
import { useState } from "react";
import CreateSchoolModal from "./CreateSchoolModal";

type School = {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    classes: number;
  };
};

type Props = {
  groupId: string;
  groupName: string;
  initialSchools: School[];
};

export default function GroupDetailClient({
  groupId,
  groupName,
  initialSchools,
}: Props) {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [openModal, setOpenModal] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  async function refreshSchools() {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/schools`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (res.ok) {
        const data = (await res.json()) as School[];
        setSchools(
          data.map((school) => ({
            id: school.id,
            name: school.name,
            createdAt: school.createdAt,
            _count: {
              classes: school._count?.classes ?? 0,
            },
          }))
        );
      } else {
        console.error("Erro ao carregar escolas");
      }
    } catch (error) {
      console.error("Erro ao buscar escolas", error);
    } finally {
      setLoadingList(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para grupos
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {groupName}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Aqui você cadastra e organiza as escolas pertencentes a este grupo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            + Criar escola
          </button>
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {loadingList && (
            <p className="mb-3 text-sm text-slate-500">Atualizando escolas…</p>
          )}

          {schools.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma escola cadastrada ainda neste grupo. Clique em{" "}
              <span className="font-semibold">“Criar escola”</span> para começar.
            </p>
          ) : (
            <ul className="space-y-3">
              {schools.map((school) => (
                <li
                  key={school.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {school.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {school._count.classes === 0
                        ? "Nenhuma turma cadastrada ainda"
                        : school._count.classes === 1
                        ? "1 turma cadastrada"
                        : `${school._count.classes} turmas cadastradas`}
                    </p>
                  </div>

                  <span className="text-sm font-medium text-slate-400">
                    Em breve
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <CreateSchoolModal
          groupId={groupId}
          open={openModal}
          onClose={() => setOpenModal(false)}
          onCreated={refreshSchools}
        />
      </div>
    </main>
  );
}
