"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import AddStudentModal from "./AddStudentModal";
import StudentModal from "./StudentModal";

type StudentStatus = "ACTIVE" | "PENDING_DELETE" | "DELETED";

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
  initialStudents: StudentItem[];
};

export default function StudentsManagerClient({
  classId,
  className,
  initialStudents,
  canManageStudents,
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

  async function handleImport(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `/api/classes/${classId}/students/import`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao importar planilha");
      return;
    }

    alert(`Importados: ${data.imported} | Ignorados: ${data.skipped}`);
    await refreshStudents();
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
      alert("Não foi possível excluir/solicitar exclusão do aluno.");
      return;
    }

    const data = await res.json();

    if (data?.mode === "deleted_directly") {
      alert("Aluno excluído diretamente pela gestão.");
    } else if (data?.mode === "requested_delete") {
      alert("Solicitação de exclusão enviada para aprovação da gestão.");
    }

    await refreshStudents();
  }

  function getItemClasses(student: StudentItem) {
    if (student.status === "ACTIVE") {
      return "bg-white";
    }

    return "bg-red-50 text-red-700";
  }

  function getStatusBadge(student: StudentItem) {
    if (student.status === "PENDING_DELETE") {
      return (
        <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
          Aguardando aprovação da gestão
        </span>
      );
    }

    if (student.status === "DELETED") {
      return (
        <span className="ml-2 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800">
          Excluído
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold">
                  Alunos — {className}
                </h1>
              </div>

              {canManageStudents ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setOpenAddModal(true)}
                    className="rounded-md bg-sky-600 px-4 py-2 text-white"
                  >
                    + Adicionar aluno
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md border border-slate-300 px-4 py-2"
                  >
                    Importar XLSX
                  </button>

                  <a
                    href="/templates/students-template.xlsx"
                    className="rounded-md border border-slate-300 px-4 py-2"
                  >
                    Baixar template
                  </a>
                </div>
              ) : null}
            </div>

            <ul className="mt-6 overflow-hidden rounded-md border">
              <li className="bg-slate-100 px-4 py-2 text-sm font-semibold">
                Lista de alunos
              </li>

              {students.map((s, i) => {
                const inactive = s.status !== "ACTIVE";

                return (
                  <li
                    key={s.id}
                    onClick={() => setSelectedStudent(s.id)}
                    className={`cursor-pointer border-t px-4 py-3 text-sm ${getItemClasses(s)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={inactive ? "line-through" : ""}>
                        {i + 1}. {s.name}
                        {getStatusBadge(s)}
                      </span>

                      {canManageStudents && s.status === "ACTIVE" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStudent(s.id);
                          }}
                          className="text-xs text-red-600"
                        >
                          Excluir
                        </button>
                      ) : null}
                    </div>

                    {s.status === "PENDING_DELETE" && s.deletedReason ? (
                      <p className="mt-1 text-xs text-amber-800">
                        Motivo informado: {s.deletedReason}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </main>

      <input
        type="file"
        accept=".xlsx,.csv"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImport(file);
        }}
      />

      {canManageStudents ? (
        <AddStudentModal
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSubmit={async () => {
            await refreshStudents();
            setOpenAddModal(false);
          }}
          loading={false}
        />
      ) : null}

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
