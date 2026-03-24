"use client";

import Link from "next/link";
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
  initialTeachers: unknown[];
  userName?: string | null;
  userEmail?: string | null;
};

export default function GroupsDashboardClient({
  initialGroups,
  userName,
  userEmail,
}: Props) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [openGroupModal, setOpenGroupModal] = useState(false);
  const [loadingGroupList, setLoadingGroupList] = useState(false);

  async function refreshGroups() {
    setLoadingGroupList(true);
    try {
      const res = await fetch("/api/groups", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (res.ok) {
        const data = (await res.json()) as Group[];
        setGroups(data);
      }
    } finally {
      setLoadingGroupList(false);
    }
  }

  return (
    <div className="mt-8 space-y-8 text-left">
      <div>
        <p className="text-sm text-slate-500">
          {userName && userEmail ? (
            <>
              Logado como{" "}
              <span className="font-medium">
                {userName} ({userEmail})
              </span>
              .
            </>
          ) : null}
        </p>
      </div>

      {/* GRUPOS */}
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Grupos de escolas
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Organize suas escolas em grupos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpenGroupModal(true)}
            className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            + Criar grupo
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {loadingGroupList && (
            <p className="mb-3 text-sm text-slate-500">Atualizando grupos…</p>
          )}

          {groups.length === 0 ? (
            <p className="text-sm text-slate-500">
              Você ainda não possui nenhum grupo de escolas.
            </p>
          ) : (
            <ul className="space-y-3">
              {groups.map((group) => (
                <li key={group.id}>
                  <Link
                    href={`/groups/${group.id}`}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {group.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {group._count.schools} escolas cadastradas
                      </p>
                    </div>

                    <span className="text-sm font-medium text-sky-700">
                      Abrir
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* CARD PROFESSORES */}
      <section className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Professores
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Cadastre professores e gerencie vínculos com turmas.
              </p>
            </div>

            <Link
              href="/teachers"
              className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Abrir
            </Link>
          </div>
        </div>
      </section>

      <CreateGroupModal
        open={openGroupModal}
        onClose={() => setOpenGroupModal(false)}
        onCreated={refreshGroups}
      />
    </div>
  );
}
