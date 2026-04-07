"use client";

type Student = {
  studentId: string;
  studentName: string;
  frequency: number;
};

type AlertItem = {
  classId: string;
  className: string;
  schoolName: string;
  students: Student[];
};

export default function AlertsModal({
  alert,
  onClose,
}: {
  alert: AlertItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b px-4 py-3 font-semibold">
          ⚠️ Alunos com faltas consecutivas
        </div>

        <div className="px-4 py-3 text-sm">
          <p className="font-semibold">{alert.schoolName}</p>
          <p className="text-slate-500">{alert.className}</p>

          <div className="mt-4 space-y-3">
            {alert.students.map((s) => (
              <div
                key={s.studentId}
                className="rounded border px-3 py-2 bg-slate-50"
              >
                <p className="font-medium">{s.studentName}</p>
                <p className="text-xs text-slate-500">
                  Frequência: {s.frequency}%
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-md border px-3 py-1 text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
