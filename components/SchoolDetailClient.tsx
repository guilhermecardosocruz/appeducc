"use client";

import Link from "next/link";
import { useState } from "react";
import CreateClassModal from "./CreateClassModal";

type TeacherOption = {
  id: string;
  name: string;
  email: string;
};

type ClassItem = {
  id: string;
  name: string;
  year: number | null;
  createdAt: string;
  teacher: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    students: number;
  };
};

type Props = {
  schoolId: string;
  schoolName: string;
  groupId: string;
  teachers: TeacherOption[];
  initialClasses: ClassItem[];
  canManageSchool: boolean;
};

export default function SchoolDetailClient({
  schoolId,
  schoolName,
  groupId,
  teachers,
  initialClasses,
  canManageSchool,
}: Props) {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [openModal, setOpenModal] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  async function refreshClasses() {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/classes`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (res.ok) {
        const data = (await res.json()) as ClassItem[];
        setClasses(
          data.map((item) => ({
            id: item.id,
            name: item.name,
            year: item.year ?? null,
            createdAt: item.createdAt,
            teacher: item.teacher
              ? {
                  id: item.teacher.id,
                  name: item.teacher.name,
                  email: item.teacher.email,
                }
              : null,
            _count: {
              students: item._count?.students ?? 0,
            },
          }))
        );
      } else {
        console.error("Erro ao carregar turmas");
      }
    } catch (error) {
      console.error("Erro ao buscar turmas", error);
    } finally {
      setLoadingList(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para escolas
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {schoolName}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Aqui você cadastra e organiza as turmas pertencentes a esta escola.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/schools/${schoolId}/reports`}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Relatórios
            </Link>

            {canManageSchool ? (
              <button
                type="button"
                onClick={() => setOpenModal(true)}
                className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                + Criar turma
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {loadingList && (
            <p className="mb-3 text-sm text-slate-500">Atualizando turmas…</p>
          )}

          {classes.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma turma cadastrada ainda nesta escola.
            </p>
          ) : (
            <ul className="space-y-3">
              {classes.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/classes/${item.id}`}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.year ? `Ano letivo ${item.year} • ` : ""}
                        {item._count.students === 0
                          ? "Nenhum aluno cadastrado ainda"
                          : item._count.students === 1
                          ? "1 aluno cadastrado"
                          : `${item._count.students} alunos cadastrados`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.teacher
                          ? `Professor: ${item.teacher.name}`
                          : "Professor não vinculado"}
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

        {canManageSchool ? (
          <CreateClassModal
            schoolId={schoolId}
            teachers={teachers}
            open={openModal}
            onClose={() => setOpenModal(false)}
            onCreated={refreshClasses}
          />
        ) : null}
      </div>
    </main>
  );
}
