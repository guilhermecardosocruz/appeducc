"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import AddStudentModal from "./AddStudentModal";
import StudentModal from "./StudentModal";

type StudentStatus =
  | "ACTIVE"
  | "PENDING_ENTRY"
  | "PENDING_DELETE"
  | "DELETED";

type StudentItem = {
  id: string;
  name: string;
  status: StudentStatus;
  createdAt: string;
  deletedAt?: string | null;
  deletedReason?: string | null;
};

type Props = {
  classId: string;
  className: string;
  canImportSpreadsheet: boolean;
  canManageStudents: boolean;
  isManager: boolean;
  initialStudents: StudentItem[];
};

export default function StudentsManagerClient({
  classId,
  className,
  initialStudents,
  canManageStudents,
  canImportSpreadsheet,
  isManager,
}: Props) {
  const [students, setStudents] = useState<StudentItem[]>(initialStudents);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refreshStudents() {
    const res = await fetch(`/api/classes/${classId}/students`, {
      cache: "no-store",
    });

    if (!res.ok) return;

    const data = await res.json();
    setStudents(data);
  }

  async function handleDeleteStudent(studentId: string) {
    const reason = prompt("Motivo da exclusão:");
    if (!reason) return;

    const res = await fetch(`/api/classes/${classId}/students/${studentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) {
      alert("Erro ao excluir aluno");
      return;
    }

    await refreshStudents();
  }

  function getItemClasses(student: StudentItem) {
    if (student.status === "ACTIVE") return "bg-white";
    return "bg-amber-50 text-amber-800";
  }

  function getStatusBadge(student: StudentItem) {
    if (student.status === "PENDING_ENTRY") {
      return (
        <span className="ml-2 text-xs text-blue-600">
          (Aguardando autorização)
        </span>
      );
    }

    if (student.status === "PENDING_DELETE") {
      return (
        <span className="ml-2 text-xs text-amber-600">
          (Aguardando exclusão)
        </span>
      );
    }

    return null;
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6">
            <Link href={`/classes/${classId}`} className="text-sky-700">
              ← Voltar
            </Link>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex justify-between">
              <h1 className="text-xl font-semibold">
                Alunos — {className}
              </h1>

              {isManager && (
                <button
                  onClick={() => setOpenAddModal(true)}
                  className="rounded-md bg-sky-600 px-4 py-2 text-white"
                >
                  + Adicionar aluno
                </button>
              )}
            </div>

            <ul className="mt-6 overflow-hidden rounded-md border">
              <li className="bg-slate-100 px-4 py-2 text-sm font-semibold">
                Lista de alunos
              </li>

              {students.map((s, i) => (
                <li
                  key={s.id}
                  onClick={() => setSelectedStudent(s.id)}
                  className={`cursor-pointer border-t px-4 py-3 text-sm flex justify-between ${getItemClasses(
                    s
                  )}`}
                >
                  <span>
                    {i + 1}. {s.name}
                    {getStatusBadge(s)}
                  </span>

                  {canManageStudents && s.status === "ACTIVE" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStudent(s.id);
                      }}
                      className="text-red-600 text-xs"
                    >
                      Excluir
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {isManager && (
        <AddStudentModal
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSubmit={async () => {
            await refreshStudents();
            setOpenAddModal(false);
          }}
          loading={false}
        />
      )}

      <StudentModal
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        classId={classId}
        studentId={selectedStudent}
        onUpdated={refreshStudents}
      />
    </>
  );
}
