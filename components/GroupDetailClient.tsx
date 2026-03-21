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
  canManageSchools: boolean;
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
  const [loadingMembers, setLoadingMembers] = useState(false);

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

  async function refreshMembers() {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (res.ok) {
        const data = (await res.json()) as GroupMemberItem[];
        setMembers(data);
      } else {
        console.error("Erro ao carregar equipe do grupo");
      }
    } catch (error) {
      console.error("Erro ao buscar equipe do grupo", error);
    } finally {
      setLoadingMembers(false);
    }
  }

  async function handleRemoveMember(memberUserId: string, memberName: string, role: string) {
    if (role === "OWNER") {
      alert("O OWNER não pode ser removido nesta versão.");
      return;
    }

    const confirmed = window.confirm(
      `Remover ${memberName} da equipe deste grupo?`
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

  function getRoleLabel(role: string) {
    if (role === "OWNER") return "Criador";
    if (role === "MANAGER") return "Gestor do grupo";
    if (role === "VIEWER") return "Acompanhamento";
    return role;
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
                  onClick={() => setOpenMembersModal(true)}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Gerenciar equipe
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setOpenSchoolModal(true)}
                className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                + Criar escola
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Equipe do grupo
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pessoas com acesso a este grupo.
                </p>
              </div>

              {loadingMembers ? (
                <span className="text-xs text-slate-500">Atualizando equipe…</span>
              ) : null}
            </div>

            {members.length === 0 ? (
              <p className="text-sm text-slate-500">
                Ainda não há membros vinculados a este grupo.
              </p>
            ) : (
              <ul className="space-y-3">
                {members.map((member) => (
                  <li
                    key={member.userId}
                    className="rounded-md border border-slate-200 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {member.name}
                          {member.userId === currentUserId ? (
                            <span className="ml-2 text-xs text-slate-500">(você)</span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{member.email}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                            {getRoleLabel(member.role)}
                          </span>

                          {member.canManageSchools ? (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              Gestão de escolas
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              Sem gestão de escolas
                            </span>
                          )}
                        </div>
                      </div>

                      {canManageMembers && member.role !== "OWNER" ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveMember(member.userId, member.name, member.role)
                          }
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Remover
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
                  <li key={school.id}>
                    <Link
                      href={`/schools/${school.id}`}
                      className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
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

                      <span className="text-sm font-medium text-sky-700">
                        Abrir
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <CreateSchoolModal
            groupId={groupId}
            open={openSchoolModal}
            onClose={() => setOpenSchoolModal(false)}
            onCreated={refreshSchools}
          />
        </div>
      </main>

      <ManageGroupMembersModal
        groupId={groupId}
        open={openMembersModal}
        onClose={() => setOpenMembersModal(false)}
        onCreated={refreshMembers}
      />
    </>
  );
}
