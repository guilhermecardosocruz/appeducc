"use client";

import Link from "next/link";
import { useState } from "react";
import CreateTeacherModal from "./CreateTeacherModal";

type Teacher = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  _count: {
    classes: number;
  };
};

type Props = {
  initialTeachers: Teacher[];
  groupId?: string;
  title?: string;
};

export default function TeachersListClient({
  initialTeachers,
  groupId,
  title = "Lista de professores",
}: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [openTeacherModal, setOpenTeacherModal] = useState(false);
  const [loadingTeacherList, setLoadingTeacherList] = useState(false);

  async function refreshTeachers() {
    setLoadingTeacherList(true);
    try {
      const url = groupId
        ? `/api/teachers?groupId=${encodeURIComponent(groupId)}`
        : "/api/teachers";

      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (res.ok) {
        const data = (await res.json()) as Teacher[];
        setTeachers(data);
      }
    } finally {
      setLoadingTeacherList(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>

        <button
          type="button"
          onClick={() => setOpenTeacherModal(true)}
          className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
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
            Você ainda não cadastrou professores.
          </p>
        ) : (
          <ul className="space-y-3">
            {teachers.map((teacher) => (
              <li key={teacher.id}>
                <Link
                  href={`/teachers/${teacher.id}${
                    groupId ? `?groupId=${encodeURIComponent(groupId)}` : ""
                  }`}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {teacher.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {teacher.email}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">
                      {teacher._count.classes === 0
                        ? "Nenhuma turma vinculada"
                        : teacher._count.classes === 1
                          ? "1 turma vinculada"
                          : `${teacher._count.classes} turmas vinculadas`}
                    </p>
                    <p className="mt-1 text-xs font-medium text-sky-700">
                      Abrir
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateTeacherModal
        open={openTeacherModal}
        onClose={() => setOpenTeacherModal(false)}
        onCreated={refreshTeachers}
        groupId={groupId}
      />
    </div>
  );
}
