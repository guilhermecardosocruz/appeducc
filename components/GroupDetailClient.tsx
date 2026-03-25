"use client";

import Link from "next/link";
import { useState } from "react";
import CreateSchoolModal from "./CreateSchoolModal";
import ManageGroupMembersModal from "./ManageGroupMembersModal";

type School = {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    classes: number;
  };
};

type GroupMemberItem = {
  userId: string;
  name: string;
  email: string;
  cpf: string | null;
  isTeacher: boolean;
  role: string;
  memberSince: string;
  createdAt: string;
};

type Props = {
  groupId: string;
  groupName: string;
  initialSchools: School[];
  initialMembers: GroupMemberItem[];
  canManageMembers: boolean;
  currentUserId: string;
};

export default function GroupDetailClient({
  groupId,
  groupName,
  initialSchools,
  initialMembers,
  canManageMembers,
  currentUserId,
}: Props) {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [members, setMembers] = useState<GroupMemberItem[]>(initialMembers);
  const [openSchoolModal, setOpenSchoolModal] = useState(false);
  const [openMembersModal, setOpenMembersModal] = useState(false);
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
        setSchools(data);
      }
    } finally {
      setLoadingList(false);
    }
  }

  async function refreshMembers() {
    if (!canManageMembers) return;

    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as GroupMemberItem[];
      setMembers(data);
    }
  }

  async function handleRemoveMember(
    memberUserId: string,
    memberName: string,
    role: string
  ) {
    if (role === "OWNER") {
      alert("O OWNER não pode ser removido nesta versão.");
      return;
    }

    const confirmed = window.confirm(
      `Remover ${memberName} da gestão deste grupo?`
    );

    if (!confirmed) return;

    const res = await fetch(`/api/groups/${groupId}/members/${memberUserId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "Não foi possível remover o membro.");
      return;
    }

    await refreshMembers();
  }

  return (
    <>
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

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {groupName}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Aqui você cadastra e organiza as escolas pertencentes a este grupo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/groups/${groupId}/teachers`}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Professores
              </Link>

              <Link
                href={`/groups/${groupId}/reports`}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Relatórios
              </Link>

              {canManageMembers ? (
                <button
                  type="button"
                  onClick={() => setOpenMembersModal(true)}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Compartilhar gestão
                </button>
              ) : null}

              {canManageMembers ? (
                <button
                  type="button"
                  onClick={() => setOpenSchoolModal(true)}
                  className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
                >
                  + Criar escola
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            {loadingList && (
              <p className="mb-3 text-sm text-slate-500">Atualizando escolas…</p>
            )}

            {schools.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma escola visível para este acesso neste grupo.
              </p>
            ) : (
              <ul className="space-y-3">
                {schools.map((school) => (
                  <li key={school.id}>
                    <Link
                      href={`/schools/${school.id}`}
                      className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {school.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {school._count.classes} turmas cadastradas
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
        </div>

        {canManageMembers ? (
          <CreateSchoolModal
            groupId={groupId}
            open={openSchoolModal}
            onClose={() => setOpenSchoolModal(false)}
            onCreated={refreshSchools}
          />
        ) : null}
      </main>

      {canManageMembers ? (
        <ManageGroupMembersModal
          groupId={groupId}
          open={openMembersModal}
          onClose={() => setOpenMembersModal(false)}
          onCreated={refreshMembers}
          members={members}
          currentUserId={currentUserId}
          onRemoveMember={handleRemoveMember}
        />
      ) : null}
    </>
  );
}
