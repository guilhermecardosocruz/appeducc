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

type Member = {
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
  initialMembers: Member[];
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
  const [schools] = useState(initialSchools);
  const [members, setMembers] = useState(initialMembers);

  const [openSchoolModal, setOpenSchoolModal] = useState(false);
  const [openMembersModal, setOpenMembersModal] = useState(false);

  async function refreshMembers() {
    location.reload(); // mantém simples por enquanto
  }

  async function handleRemoveMember(userId: string) {
    await fetch(`/api/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    });
    refreshMembers();
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-6">
            <Link href="/dashboard" className="text-sm text-sky-700">
              ← Voltar para grupos
            </Link>
          </div>

          <h1 className="text-2xl font-semibold">{groupName}</h1>

          <p className="mt-2 text-sm text-slate-500">
            Aqui você cadastra e organiza as escolas pertencentes a este grupo.
          </p>

          {/* BOTÕES */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={`/groups/${groupId}/teachers`}
              className="px-4 py-2 border rounded text-sm bg-white"
            >
              Professores
            </Link>

            <Link
              href={`/groups/${groupId}/reports`}
              className="px-4 py-2 border rounded text-sm bg-white"
            >
              Relatórios
            </Link>

            <Link
              href={`/groups/${groupId}/content-plans`}
              className="px-4 py-2 border rounded text-sm bg-white"
            >
              Planejamentos
            </Link>

            {/* 🔥 BOTÃO HORÁRIOS */}
            <Link
              href={`/groups/${groupId}/horarios`}
              className="px-4 py-2 border rounded text-sm bg-white text-sky-700 hover:bg-sky-50"
            >
              Horários
            </Link>

            {canManageMembers && (
              <button
                onClick={() => setOpenMembersModal(true)}
                className="px-4 py-2 border rounded text-sm bg-white"
              >
                Compartilhar gestão
              </button>
            )}

            {canManageMembers && (
              <button
                onClick={() => setOpenSchoolModal(true)}
                className="px-4 py-2 bg-sky-600 text-white rounded text-sm"
              >
                + Criar escola
              </button>
            )}
          </div>

          {/* LISTA */}
          <div className="mt-8 bg-white p-4 border rounded">
            {schools.map((school) => (
              <Link
                key={school.id}
                href={`/schools/${school.id}`}
                className="flex justify-between border p-4 rounded mb-3 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium">{school.name}</p>
                  <p className="text-xs text-gray-500">
                    {school._count.classes} turmas cadastradas
                  </p>
                </div>

                <span className="text-sky-700">Abrir</span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <CreateSchoolModal
        groupId={groupId}
        open={openSchoolModal}
        onClose={() => setOpenSchoolModal(false)}
        onCreated={() => location.reload()}
      />

      <ManageGroupMembersModal
        groupId={groupId}
        open={openMembersModal}
        members={members}
        currentUserId={currentUserId}
        onClose={() => setOpenMembersModal(false)}
        onCreated={refreshMembers}
        onRemoveMember={handleRemoveMember}
      />
    </>
  );
}
