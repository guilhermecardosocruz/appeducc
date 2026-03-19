"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import AddStudentModal from "./AddStudentModal";

type StudentItem = {
  id: string;
  name: string;
  createdAt: string;
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
  canImportSpreadsheet,
  initialStudents,
}: Props) {
  const [students, setStudents] = useState<StudentItem[]>(initialStudents);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function refreshStudents() {
    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("Erro ao carregar alunos");
        return;
      }

      const data = (await res.json()) as StudentItem[];
      setStudents(
        data.map((student) => ({
          id: student.id,
          name: student.name,
          createdAt: student.createdAt,
        }))
      );
    } catch (error) {
      console.error("Erro ao atualizar alunos", error);
    }
  }

  async function handleAddStudent(name: string) {
    setAddingStudent(true);

    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        console.error("Erro ao adicionar aluno");
        return;
      }

      await refreshStudents();
      setOpenAddModal(false);
      setImportMessage(null);
    } catch (error) {
      console.error("Erro ao adicionar aluno", error);
    } finally {
      setAddingStudent(false);
    }
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    setImportMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/classes/${classId}/students/import`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro ao importar planilha", data);
        setImportMessage(data.error ?? "Erro ao importar planilha.");
        return;
      }

      setStudents(
        (data.students as StudentItem[]).map((student) => ({
          id: student.id,
          name: student.name,
          createdAt: student.createdAt,
        }))
      );

      setImportMessage(
        `Importação concluída: ${data.imported} aluno(s) importado(s), ${data.skipped} ignorado(s).`
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Erro ao importar planilha", error);
      setImportMessage("Erro ao importar planilha.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6">
            <Link
              href={`/classes/${classId}`}
              className="text-sm font-medium text-sky-700 hover:text-sky-800"
            >
              ← Voltar para turma
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Alunos — {className}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Gerencie os alunos cadastrados nesta turma.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setOpenAddModal(true)}
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                >
                  + Adicionar aluno
                </button>
              </div>
            </div>

            {canImportSpreadsheet && (
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  Importar alunos por planilha
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Envie um arquivo Excel (.xlsx, .xls) ou CSV com a lista de
                  alunos. A primeira coluna ou o cabeçalho &quot;Nome&quot; será usado.
                </p>

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-800"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleImportFile(file);
                      }
                    }}
                    disabled={importing}
                  />

                  <div className="text-sm text-slate-500">
                    {importing ? "Importando planilha..." : "Somente gestor"}
                  </div>
                </div>

                {importMessage && (
                  <p className="mt-3 text-sm text-slate-600">{importMessage}</p>
                )}
              </div>
            )}

            <div className="mt-6">
              {students.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Ainda não há alunos cadastrados nesta turma.
                </p>
              ) : (
                <ul className="overflow-hidden rounded-md border border-slate-200">
                  <li className="grid grid-cols-[56px_1fr] items-center gap-3 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    <span>#</span>
                    <span>Aluno</span>
                  </li>

                  {students.map((student, index) => (
                    <li
                      key={student.id}
                      className="grid grid-cols-[56px_1fr] items-center gap-3 border-t border-slate-200 px-4 py-3"
                    >
                      <span className="text-sm text-slate-500">{index + 1}</span>
                      <span className="text-sm font-medium text-slate-900">
                        {student.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      <AddStudentModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSubmit={handleAddStudent}
        loading={addingStudent}
      />
    </>
  );
}
