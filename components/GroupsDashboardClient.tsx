"use client";

import Link from "next/link";
import { useState } from "react";
import CreateGroupModal from "./CreateGroupModal";
import CreateTeacherModal from "./CreateTeacherModal";

type Group = {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    schools: number;
  };
};

type Teacher = {
  id: string;
  name: string;
  email: string;
  isTeacher: boolean;
  createdAt: string;
  _count: {
    classes: number;
  };
};

type Props = {
  initialGroups: Group[];
  initialTeachers: Teacher[];
  userName?: string | null;
  userEmail?: string | null;
};

export default function GroupsDashboardClient({
  initialGroups,
  initialTeachers,
  userName,
  userEmail,
}: Props) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [openGroupModal, setOpenGroupModal] = useState(false);
  const [openTeacherModal, setOpenTeacherModal] = useState(false);
  const [loadingGroupList, setLoadingGroupList] = useState(false);
  const [loadingTeacherList, setLoadingTeacherList] = useState(false);

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
      setLoadingGroupList(false);
    }
  }

  async function refreshTeachers() {
    setLoadingTeacherList(true);
    try {
      const res = await fetch("/api/teachers", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (res.ok) {
        const data = (await res.json()) as Teacher[];
        setTeachers(
          data.map((teacher) => ({
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            isTeacher: teacher.isTeacher,
            createdAt: teacher.createdAt,
            _count: {
              classes: teacher._count?.classes ?? 0,
            },
          }))
        );
      } else {
        console.error("Erro ao carregar professores");
      }
    } catch (error) {
      console.error("Erro ao buscar professores", error);
    } finally {
      setLoadingTeacherList(false);
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

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Grupos de escolas
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Organize suas escolas em grupos, como redes municipais, privadas ou
              projetos específicos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpenGroupModal(true)}
            className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
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
              Você ainda não possui nenhum grupo de escolas. Clique em{" "}
              <span className="font-semibold">“Criar grupo”</span> para começar.
            </p>
          ) : (
            <ul className="space-y-3">
              {groups.map((group) => (
                <li key={group.id}>
                  <Link
                    href={`/groups/${group.id}`}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
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

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Professores</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre professores com e-mail e senha temporária para acesso ao
              sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpenTeacherModal(true)}
            className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            + Adicionar professor
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {loadingTeacherList && (
            <p className="mb-3 text-sm text-slate-500">
              Atualizando professores…
            </p>
          )}

          {teachers.length === 0 ? (
            <p className="text-sm text-slate-500">
              Você ainda não cadastrou professores. Clique em{" "}
              <span className="font-semibold">“Adicionar professor”</span> para
              começar.
            </p>
          ) : (
            <ul className="space-y-3">
              {teachers.map((teacher) => (
                <li
                  key={teacher.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {teacher.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{teacher.email}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">
                      {teacher._count.classes === 0
                        ? "Nenhuma turma vinculada"
                        : teacher._count.classes === 1
                        ? "1 turma vinculada"
                        : `${teacher._count.classes} turmas vinculadas`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <CreateGroupModal
        open={openGroupModal}
        onClose={() => setOpenGroupModal(false)}
        onCreated={refreshGroups}
      />

      <CreateTeacherModal
        open={openTeacherModal}
        onClose={() => setOpenTeacherModal(false)}
        onCreated={refreshTeachers}
      />
    </div>
  );
}
