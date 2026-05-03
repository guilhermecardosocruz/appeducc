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
  const [loadingBackup, setLoadingBackup] = useState(false);

  async function loadBackups() {
    const res = await fetch(`/api/groups/${groupId}/backup`);
    if (res.ok) {
      const data = await res.json();
      setBackups(data);
    }
  }

  async function handleOpenBackup() {
    setOpenBackupModal(true);
    await loadBackups();
  }

  async function createBackup() {
    setLoadingBackup(true);
    await fetch(`/api/groups/${groupId}/backup/create`, {
      method: "POST",
    });
    await loadBackups();
    setLoadingBackup(false);
  }

  async function restoreBackup(id: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja restaurar este backup? Isso substituirá todos os dados do grupo."
    );

    if (!confirmed) return;

    await fetch(`/api/groups/${groupId}/backup/${id}/restore`, {
      method: "POST",
    });

    alert("Backup restaurado com sucesso!");
    location.reload();
  }

  async function refreshSchools() {
    const res = await fetch(`/api/groups/${groupId}/schools`);
    if (res.ok) {
      const data = await res.json();
      setSchools(data);
    }
  }

  async function refreshMembers() {
    if (!canManageMembers) return;
    const res = await fetch(`/api/groups/${groupId}/members`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data);
    }
  }

  async function handleRemoveMember(
    memberUserId: string,
    memberName: string,
    role: string
  ) {
    if (role === "OWNER") {
      alert("O OWNER não pode ser removido.");
      return;
    }

    const confirmed = window.confirm(
      `Remover ${memberName} da gestão deste grupo?`
    );

    if (!confirmed) return;

    await fetch(`/api/groups/${groupId}/members/${memberUserId}`, {
      method: "DELETE",
    });

    await refreshMembers();
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto w-full max-w-4xl">

          <div className="mb-6">
            <Link href="/dashboard" className="text-sm text-sky-700">
              ← Voltar
            </Link>
          </div>

          <div className="flex flex-wrap justify-between gap-4">
            <h1 className="text-2xl font-semibold">{groupName}</h1>

            <div className="flex flex-wrap gap-2">

              {canManageMembers && (
                <button
                  onClick={handleOpenBackup}
                  className="px-4 py-2 bg-purple-600 text-white rounded"
                >
                  Backup
                </button>
              )}

              {canManageMembers && (
                <button
                  onClick={() => setOpenSchoolModal(true)}
                  className="px-4 py-2 bg-sky-600 text-white rounded"
                >
                  + Criar escola
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 bg-white p-4 rounded border">
            {schools.map((s) => (
              <div key={s.id} className="border-b py-2">
                {s.name}
              </div>
            ))}
          </div>
        </div>
      </main>

      {openBackupModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Backups</h2>

            <button
              onClick={createBackup}
              disabled={loadingBackup}
              className="w-full bg-green-600 text-white px-4 py-2 rounded"
            >
              {loadingBackup ? "Criando..." : "Criar Backup"}
            </button>

            <div className="space-y-2 max-h-60 overflow-auto">
              {backups.map((b) => (
                <div
                  key={b.id}
                  className="flex justify-between items-center border p-2 rounded"
                >
                  <span className="text-sm">
                    {new Date(b.createdAt).toLocaleString()}
                  </span>
                  <button
                    onClick={() => restoreBackup(b.id)}
                    className="text-red-600 text-sm"
                  >
                    Restaurar
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setOpenBackupModal(false)}
              className="w-full border px-4 py-2 rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {canManageMembers && (
        <CreateSchoolModal
          groupId={groupId}
          open={openSchoolModal}
          onClose={() => setOpenSchoolModal(false)}
          onCreated={refreshSchools}
        />
      )}

      {canManageMembers && (
        <ManageGroupMembersModal
          groupId={groupId}
          open={openMembersModal}
          onClose={() => setOpenMembersModal(false)}
          onCreated={refreshMembers}
          members={members}
          currentUserId={currentUserId}
          onRemoveMember={handleRemoveMember}
        />
      )}
    </>
  );
}
