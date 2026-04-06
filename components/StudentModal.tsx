"use client";

import { useEffect, useState } from "react";

type StudentStats = {
  total: number;
  presents: number;
  absents: number;
  percentage: number;
};

type StudentStatus = "ACTIVE" | "PENDING_ENTRY" | "PENDING_DELETE" | "DELETED";

type StudentData = {
  id: string;
  name: string;
  status: StudentStatus;
  deletedAt: string | null;
  deletedReason: string | null;
  canApproveDelete: boolean;
  canManageClass: boolean;
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
      const res = await fetch(`/api/classes/${classId}/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao salvar aluno");
        return;
      }

      await onUpdated();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function requestDelete() {
    if (!studentId) return;

    const reason = prompt("Motivo da exclusão:");
    if (!reason) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/classes/${classId}/students/${studentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao solicitar exclusão");
        return;
      }

      await onUpdated();
      await reloadStudent();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function approveEntry() {
    if (!studentId) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/classes/${classId}/students/${studentId}/approve`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao aprovar aluno");
        return;
      }

      await onUpdated();
      await reloadStudent();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function rejectEntry() {
    if (!studentId) return;

    const confirmReject = confirm(
      "Tem certeza que deseja rejeitar a entrada deste aluno?"
    );

    if (!confirmReject) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/classes/${classId}/students/${studentId}/reject`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao rejeitar entrada");
        return;
      }

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
      const res = await fetch(`/api/classes/${classId}/students/${studentId}/restore`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao restaurar aluno");
        return;
      }

      await onUpdated();
      await reloadStudent();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function permanentDelete() {
    if (!studentId) return;

    const confirmDelete = confirm(
      "Tem certeza que deseja EXCLUIR PERMANENTEMENTE este aluno? Esta ação não pode ser desfeita."
    );

    if (!confirmDelete) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/classes/${classId}/students/${studentId}/permanent`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao excluir permanentemente");
        return;
      }

      await onUpdated();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!open || !student) return null;

  const inactive = student.status !== "ACTIVE";
  const canManage = student.canManageClass;
  const canRestore = canManage && student.status === "PENDING_DELETE";
  const canRequestDelete = canManage && student.status === "ACTIVE";
  const canPermanentDelete = student.canApproveDelete;
  const canApproveEntry = student.canApproveDelete && student.status === "PENDING_ENTRY";
  const canRejectEntry = student.canApproveDelete && student.status === "PENDING_ENTRY";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6">
        <h2 className="text-lg font-semibold">Aluno</h2>

        <div>
          <label className="text-sm">Nome</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canManage || loading}
          />
        </div>

        {inactive ? (
          <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p>Presenças: {student.stats.presents}</p>
            <p>Faltas: {student.stats.absents}</p>
            <p>Frequência: {student.stats.percentage}%</p>
            {student.deletedReason ? <p>Motivo: {student.deletedReason}</p> : null}
            {student.status === "PENDING_ENTRY" ? (
              <p>Aguardando autorização da gestão.</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p>Presenças: {student.stats.presents}</p>
            <p>Faltas: {student.stats.absents}</p>
            <p>Frequência: {student.stats.percentage}%</p>
          </div>
        )}

        {canApproveEntry || canRejectEntry || canRestore || canRequestDelete || canPermanentDelete ? (
          <div className="flex flex-wrap gap-2">
            {canApproveEntry ? (
              <button
                onClick={approveEntry}
                disabled={loading}
                className="rounded bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Aprovar entrada
              </button>
            ) : null}

            {canRejectEntry ? (
              <button
                onClick={rejectEntry}
                disabled={loading}
                className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Rejeitar entrada
              </button>
            ) : null}

            {canRestore ? (
              <button
                onClick={restoreStudent}
                disabled={loading}
                className="rounded bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Restaurar aluno
              </button>
            ) : null}

            {canRequestDelete ? (
              <button
                onClick={requestDelete}
                disabled={loading}
                className="rounded bg-amber-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Solicitar exclusão
              </button>
            ) : null}

            {canPermanentDelete ? (
              <button
                onClick={permanentDelete}
                disabled={loading}
                className="rounded bg-red-700 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Excluir permanentemente
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={loading}>
            Fechar
          </button>
          {canManage ? (
            <button
              onClick={saveName}
              disabled={loading}
              className="rounded bg-sky-600 px-3 py-1 text-white disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
