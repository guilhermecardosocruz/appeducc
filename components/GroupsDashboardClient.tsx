"use client";

import { useState } from "react";
import CreateGroupModal from "./CreateGroupModal";

type Group = {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    schools: number;
  };
};

type Props = {
  initialGroups: Group[];
  userName?: string | null;
  userEmail?: string | null;
};

export default function GroupsDashboardClient({
  initialGroups,
  userName,
  userEmail,
}: Props) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [openModal, setOpenModal] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  async function refreshGroups() {
    setLoadingList(true);
    try {
      const res = await fetch("/api/groups", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (res.ok) {
        const data = (await res.json()) as Group[];
        setGroups(
          data.map((g) => ({
            id: g.id,
            name: g.name,
            createdAt: g.createdAt,
            _count: { schools: g._count?.schools ?? 0 },
          }))
        );
      } else {
        console.error("Erro ao carregar grupos");
      }
    } catch (error) {
      console.error("Erro ao buscar grupos", error);
    } finally {
      setLoadingList(false);
    }
  }

  return (
    <div className="mt-8 space-y-6 text-left">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Grupos de escolas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Organize suas escolas em grupos, como redes municipais, privadas ou
            projetos específicos.
          </p>
          {userName && userEmail && (
            <p className="mt-2 text-xs text-slate-500">
              Logado como{" "}
              <span className="font-medium">
                {userName} ({userEmail})
              </span>
              .
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          + Criar grupo
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        {loadingList && (
          <p className="text-sm text-slate-500 mb-3">Atualizando grupos…</p>
        )}

        {groups.length === 0 ? (
          <p className="text-sm text-slate-500">
            Você ainda não possui nenhum grupo de escolas. Clique em{" "}
            <span className="font-semibold">“Criar grupo”</span> para começar.
          </p>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li
                key={group.id}
                className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {group.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {group._count.schools === 0
                      ? "Nenhuma escola cadastrada ainda"
                      : group._count.schools === 1
                      ? "1 escola cadastrada"
                      : `${group._count.schools} escolas cadastradas`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateGroupModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={refreshGroups}
      />
    </div>
  );
}
