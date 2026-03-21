"use client";

import { useEffect, useState } from "react";

type StudentStats = {
  total: number;
  presents: number;
  absents: number;
  percentage: number;
};

type StudentStatus = "ACTIVE" | "PENDING_DELETE" | "DELETED";

type StudentData = {
  id: string;
  name: string;
  status: StudentStatus;
  deletedAt: string | null;
  deletedReason: string | null;
  canApproveDelete: boolean;
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !studentId) return;

    async function load() {
      const res = await fetch(`/api/classes/${classId}/students/${studentId}`);

      if (!res.ok) return;

      const data: StudentData = await res.json();
      setStudent(data);
      setName(data.name);
    }

    load();
  }, [open, studentId, classId]);

  async function reloadStudent() {
    if (!studentId) return;

    const res = await fetch(`/api/classes/${classId}/students/${studentId}`);
    if (!res.ok) return;

    const data: StudentData = await res.json();
    setStudent(data);
    setName(data.name);
  }

  async function saveName() {
    if (!studentId) return;

    setLoading(true);

    try {
      await fetch(`/api/classes/${classId}/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      await onUpdated();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function restoreStudent() {
    if (!studentId) return;

    setLoading(true);

    try {
      await fetch(`/api/classes/${classId}/students/${studentId}/restore`, {
        method: "POST",
      });

      await onUpdated();
      await reloadStudent();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function approveDelete() {
    if (!studentId) return;

    setLoading(true);

    try {
      await fetch(`/api/classes/${classId}/students/${studentId}/approve`, {
        method: "POST",
      });

      await onUpdated();
      await reloadStudent();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function rejectDelete() {
    if (!studentId) return;

    setLoading(true);

    try {
      await fetch(`/api/classes/${classId}/students/${studentId}/reject`, {
        method: "POST",
      });

      await onUpdated();
      await reloadStudent();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!open || !student) return null;

  const inactive = student.status !== "ACTIVE";
  const pendingDelete = student.status === "PENDING_DELETE";
  const deleted = student.status === "DELETED";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6">
        <h2 className="text-lg font-semibold">Aluno</h2>

        <div>
          <label className="text-sm">Nome</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {inactive ? (
          <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {pendingDelete ? (
              <p className="font-medium">Aguardando aprovação da gestão.</p>
            ) : null}

            {deleted ? (
              <p className="font-medium">Aluno excluído com aprovação.</p>
            ) : null}

            {student.deletedReason ? (
              <p>
                <strong>Motivo:</strong> {student.deletedReason}
              </p>
            ) : null}

            <p>Presenças: {student.stats.presents}</p>
            <p>Faltas: {student.stats.absents}</p>
            <p>Frequência: {student.stats.percentage}%</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {pendingDelete && student.canApproveDelete ? (
            <>
              <button
                onClick={approveDelete}
                disabled={loading}
                className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Aprovar exclusão
              </button>

              <button
                onClick={rejectDelete}
                disabled={loading}
                className="rounded bg-amber-500 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Rejeitar exclusão
              </button>
            </>
          ) : null}

          {inactive ? (
            <button
              onClick={restoreStudent}
              disabled={loading}
              className="rounded bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              Reativar aluno
            </button>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={loading}>
            Fechar
          </button>
          <button
            onClick={saveName}
            disabled={loading}
            className="rounded bg-sky-600 px-3 py-1 text-white disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
