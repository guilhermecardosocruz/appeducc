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

type Backup = {
  id: string;
  createdAt: string;
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
  const [backups, setBackups] = useState<Backup[]>([]);
  const [openBackupModal, setOpenBackupModal] = useState(false);
  const [openSchoolModal, setOpenSchoolModal] = useState(false);
  const [openMembersModal, setOpenMembersModal] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);

  async function loadBackups() {
    const res = await fetch(`/api/groups/${groupId}/backup`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as Backup[];
      setBackups(data);
    }
  }

  async function handleOpenBackupModal() {
    setOpenBackupModal(true);
    await loadBackups();
  }

  async function createBackup() {
    setLoadingBackup(true);

    try {
      const res = await fetch(`/api/groups/${groupId}/backup/create`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "Não foi possível criar o backup.");
        return;
      }

      await loadBackups();
    } finally {
      setLoadingBackup(false);
    }
  }

  async function restoreBackup(backupId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja restaurar este backup? Isso substituirá os dados pedagógicos atuais deste grupo."
    );

    if (!confirmed) return;

    const res = await fetch(`/api/groups/${groupId}/backup/${backupId}/restore`, {
      method: "POST",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "Não foi possível restaurar o backup.");
      return;
    }

    alert("Backup restaurado com sucesso.");
    window.location.reload();
  }

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
              {canManageMembers ? (
                <button
                  type="button"
                  onClick={handleOpenBackupModal}
                  className="inline-flex items-center rounded-md border border-purple-300 bg-white px-4 py-2 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50"
                >
                  Backup
                </button>
              ) : null}

              {canManageMembers ? (
                <Link
                  href={`/groups/${groupId}/teachers`}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Professores
                </Link>
              ) : null}

              {canManageMembers ? (
                <Link
                  href={`/groups/${groupId}/reports`}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Relatórios
                </Link>
              ) : null}

              {canManageMembers ? (
                <Link
                  href={`/groups/${groupId}/content-plans`}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Planejamentos
                </Link>
              ) : null}

              <Link
                href={`/groups/${groupId}/horarios`}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Horários
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

      {openBackupModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Backups do grupo
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Crie um ponto de recuperação ou restaure os dados pedagógicos do grupo.
              </p>
            </div>

            <button
              type="button"
              onClick={createBackup}
              disabled={loadingBackup}
              className="mb-4 w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {loadingBackup ? "Criando backup…" : "Criar backup agora"}
            </button>

            <div className="max-h-72 space-y-2 overflow-auto">
              {backups.length === 0 ? (
                <p className="rounded-md border border-slate-200 p-3 text-sm text-slate-500">
                  Nenhum backup encontrado para este grupo.
                </p>
              ) : (
                backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(backup.createdAt).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs text-slate-500">
                        ID: {backup.id}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => restoreBackup(backup.id)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Restaurar
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpenBackupModal(false)}
              className="mt-5 w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}

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
