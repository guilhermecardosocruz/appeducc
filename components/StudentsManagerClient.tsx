"use client";

import Link from "next/link";
import { useState } from "react";
import AddStudentModal from "./AddStudentModal";
import StudentModal from "./StudentModal";

type StudentItem = {
  id: string;
  name: string;
  createdAt: string;
  deletedAt?: string | null;
  deletedReason?: string | null;
};

type Props = {
  classId: string;
  className: string;
  canImportSpreadsheet: boolean;
  initialStudents: StudentItem[];
};

export default function StudentsManagerClient({
  classId,
  className,
  initialStudents,
}: Props) {
  const [students, setStudents] = useState<StudentItem[]>(initialStudents);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

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

    await fetch(`/api/classes/${classId}/students/${studentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    await refreshStudents();
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

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start flex-wrap gap-3">
              <h1 className="text-xl font-semibold">
                Alunos — {className}
              </h1>

              <button
                onClick={() => setOpenAddModal(true)}
                className="bg-sky-600 text-white px-4 py-2 rounded-md"
              >
                + Adicionar aluno
              </button>
            </div>

            <ul className="mt-6 border rounded-md overflow-hidden">
              <li className="bg-slate-100 px-4 py-2 text-sm font-semibold">
                Lista de alunos
              </li>

              {students.map((s, i) => (
                <li
                  key={s.id}
                  onClick={() => setSelectedStudent(s.id)}
                  className={`px-4 py-2 border-t text-sm flex justify-between items-center cursor-pointer ${
                    s.deletedAt ? "bg-red-50 text-red-700 line-through" : ""
                  }`}
                >
                  <span>
                    {i + 1}. {s.name}
                    {s.deletedAt && (
                      <span className="ml-2 text-xs">
                        (Excluído)
                      </span>
                    )}
                  </span>

                  {!s.deletedAt && (
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

      <AddStudentModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSubmit={async () => {
          await refreshStudents();
          setOpenAddModal(false);
        }}
        loading={false}
      />

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
