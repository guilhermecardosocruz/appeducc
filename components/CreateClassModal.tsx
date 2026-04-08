"use client";

import { useEffect, useState } from "react";

type TeacherOption = {
  id: string;
  name: string;
  email: string;
};

type ClassItem = {
  id: string;
  name: string;
  year: number | null;
  teacher: {
    id: string;
  } | null;
};

type Schedule = {
  id: string;
  dayOfWeek: number;
  period: string;
  startTime: string;
  endTime: string;
};

type Props = {
  schoolId: string;
  teachers: TeacherOption[];
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  editingClass?: ClassItem | null;
};

export default function CreateClassModal({
  schoolId,
  teachers,
  open,
  onClose,
  onCreated,
  editingClass,
}: Props) {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [period, setPeriod] = useState("MANHA");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [loading, setLoading] = useState(false);

  const isEdit = !!editingClass;

  useEffect(() => {
    if (editingClass) {
      setName(editingClass.name);
      setYear(editingClass.year ? String(editingClass.year) : "");
      setTeacherId(editingClass.teacher?.id ?? "");

      // 🔥 BUSCAR HORÁRIO DA TURMA
      fetch(`/api/classes/${editingClass.id}/schedules`)
        .then((r) => r.json())
        .then((data: Schedule[]) => {
          if (data && data.length > 0) {
            const s = data[0];
            setDayOfWeek(String(s.dayOfWeek));
            setPeriod(s.period);
            setStartTime(s.startTime);
            setEndTime(s.endTime);
          }
        });
    } else {
      setName("");
      setYear("");
      setTeacherId("");
      setDayOfWeek("1");
      setPeriod("MANHA");
      setStartTime("");
      setEndTime("");
    }
  }, [editingClass, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(
        isEdit
          ? `/api/schools/${schoolId}/classes/${editingClass!.id}`
          : `/api/schools/${schoolId}/classes`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            year: year.trim() ? Number(year) : null,
            teacherId: teacherId || null,
            schedule: {
              dayOfWeek: Number(dayOfWeek),
              period,
              startTime,
              endTime,
            },
          }),
        }
      );

      if (res.ok) {
        onCreated();
        onClose();
      } else {
        console.error("Erro ao salvar turma");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">
          {isEdit ? "Editar Turma" : "Criar Turma"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />

          <input
            placeholder="Ano"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />

          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Professor</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium">Horário</p>

            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="1">Segunda</option>
              <option value="2">Terça</option>
              <option value="3">Quarta</option>
              <option value="4">Quinta</option>
              <option value="5">Sexta</option>
            </select>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="MANHA">Manhã</option>
              <option value="TARDE">Tarde</option>
              <option value="NOITE">Noite</option>
            </select>

            <div className="flex gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
