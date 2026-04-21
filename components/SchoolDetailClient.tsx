"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [openModal, setOpenModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  async function refreshClasses() {
    const res = await fetch(`/api/schools/${schoolId}/classes`, {
      method: "GET",
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as ClassItem[];
      setClasses(data);
    }
  }

  async function handleDeleteSchool() {
    const infoRes = await fetch(`/api/schools/${schoolId}`);
    const info = await infoRes.json();

    const confirmDelete = confirm(
      `Essa escola possui:\n\n` +
        `- ${info.classes} turmas\n` +
        `- ${info.students} alunos\n` +
        `- ${info.attendances} chamadas\n\n` +
        `Deseja realmente excluir?`
    );

    if (!confirmDelete) return;

    setLoadingDelete(true);

    try {
      const res = await fetch(`/api/schools/${schoolId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Erro ao excluir escola");
        return;
      }

      alert("Escola excluída com sucesso");

      router.push(`/groups/${groupId}`);
      router.refresh();
    } finally {
      setLoadingDelete(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <Link href={`/groups/${groupId}`} className="text-sm text-sky-700">
            ← Voltar para escolas
          </Link>
        </div>

        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{schoolName}</h1>
            <p className="text-sm text-slate-500">
              Aqui você organiza as turmas.
            </p>
          </div>

          {canManageSchool && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingClass(null);
                  setOpenModal(true);
                }}
                className="bg-sky-600 text-white px-4 py-2 rounded"
              >
                + Criar turma
              </button>

              <button
                onClick={handleDeleteSchool}
                disabled={loadingDelete}
                className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loadingDelete ? "Excluindo..." : "Excluir escola"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white p-4 border rounded space-y-3">
          {classes.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between border rounded p-4 hover:bg-slate-50 transition"
            >
              <Link href={`/classes/${item.id}`} className="flex-1">
                <p className="font-medium text-slate-900">
                  {item.name}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {item.teacher
                    ? `Professor: ${item.teacher.name}`
                    : "Sem professor"}
                </p>
              </Link>

              <div className="ml-4 flex items-center gap-3">
                <Link
                  href={`/classes/${item.id}`}
                  className="text-sm text-sky-700 hover:text-sky-800"
                >
                  Abrir
                </Link>

                {canManageSchool && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingClass(item);
                      setOpenModal(true);
                    }}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {canManageSchool && (
          <CreateClassModal
            schoolId={schoolId}
            teachers={teachers}
            open={openModal}
            editingClass={editingClass}
            onClose={() => {
              setOpenModal(false);
              setEditingClass(null);
            }}
            onCreated={refreshClasses}
          />
        )}
      </div>
    </main>
  );
}
