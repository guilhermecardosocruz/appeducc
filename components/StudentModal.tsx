"use client";

import { useEffect, useState } from "react";

type StudentStats = {
  total: number;
  presents: number;
  absents: number;
  percentage: number;
};

type StudentData = {
  id: string;
  name: string;
  deletedAt: string | null;
  deletedReason: string | null;
  stats: StudentStats;
};

type Props = {
  open: boolean;
  onClose: () => void;
  classId: string;
  studentId: string | null;
  onUpdated: () => void;
};

export default function StudentModal({
  open,
  onClose,
  classId,
  studentId,
  onUpdated,
}: Props) {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open || !studentId) return;

    async function load() {
      const res = await fetch(
        `/api/classes/${classId}/students/${studentId}`
      );

      if (!res.ok) return;

      const data: StudentData = await res.json();
      setStudent(data);
      setName(data.name);
    }

    load();
  }, [open, studentId, classId]);

  async function saveName() {
    if (!studentId) return;

    await fetch(`/api/classes/${classId}/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    onUpdated();
    onClose();
  }

  async function restoreStudent() {
    if (!studentId) return;

    await fetch(
      `/api/classes/${classId}/students/${studentId}/restore`,
      { method: "POST" }
    );

    onUpdated();
    onClose();
  }

  if (!open || !student) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">Aluno</h2>

        <div>
          <label className="text-sm">Nome</label>
          <input
            className="w-full border rounded px-3 py-2 mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {student.deletedAt && (
          <div className="text-sm text-red-600 space-y-1">
            <p><strong>Motivo:</strong> {student.deletedReason}</p>
            <p>Presenças: {student.stats.presents}</p>
            <p>Faltas: {student.stats.absents}</p>
            <p>Frequência: {student.stats.percentage}%</p>

            <button
              onClick={restoreStudent}
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded"
            >
              Reativar aluno
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Fechar</button>
          <button
            onClick={saveName}
            className="bg-sky-600 text-white px-3 py-1 rounded"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
