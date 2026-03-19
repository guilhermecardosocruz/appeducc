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
    const res = await fetch(`/api/classes/${classId}/students`, {
      cache: "no-store",
    });

    if (!res.ok) return;

    const data = await res.json();
    setStudents(data);
  }

  async function handleAddStudent(name: string) {
    setAddingStudent(true);

    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) return;

      await refreshStudents();
      setOpenAddModal(false);
      setImportMessage(null);
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
        setImportMessage(data.error ?? "Erro ao importar planilha.");
        return;
      }

      setStudents(data.students);

      setImportMessage(
        `Importado: ${data.imported} | Ignorados: ${data.skipped}`
      );

      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setImporting(false);
    }
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
              <div>
                <h1 className="text-xl font-semibold">
                  Alunos — {className}
                </h1>
              </div>

              <button
                onClick={() => setOpenAddModal(true)}
                className="bg-sky-600 text-white px-4 py-2 rounded-md"
              >
                + Adicionar aluno
              </button>
            </div>

            {canImportSpreadsheet && (
              <div className="mt-6 border rounded-lg p-4 bg-slate-50">
                <h2 className="font-semibold text-sm">
                  Importar via planilha
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href="/templates/students-template.xlsx"
                    download
                    className="text-sm px-3 py-2 border rounded-md bg-white hover:bg-slate-100"
                  >
                    ⬇ Baixar modelo Excel (.xlsx)
                  </a>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportFile(file);
                    }}
                    disabled={importing}
                    className="text-sm"
                  />
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  Use a coluna Nome na primeira coluna.
                </p>

                {importMessage && (
                  <p className="text-sm mt-2">{importMessage}</p>
                )}
              </div>
            )}

            <ul className="mt-6 border rounded-md overflow-hidden">
              <li className="bg-slate-100 px-4 py-2 text-sm font-semibold">
                Lista de alunos
              </li>

              {students.map((s, i) => (
                <li key={s.id} className="px-4 py-2 border-t text-sm">
                  {i + 1}. {s.name}
                </li>
              ))}
            </ul>
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
