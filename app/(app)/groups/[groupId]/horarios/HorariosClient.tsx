"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type GroupScheduleItem = {
  id: string;
  dayOfWeek: number;
  period: string;
  startTime: string;
  endTime: string;
  classId: string;
  className: string;
  schoolId: string;
  schoolName: string;
  teacherId: string | null;
  teacherName: string | null;
};

type Props = {
  groupId: string;
};

const dayColumns = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
];

const periodOrder = ["MATUTINO", "MANHÃ", "MANHA", "VESPERTINO", "TARDE", "NOTURNO", "NOITE"];

function normalizePeriod(period: string) {
  return String(period ?? "").trim().toUpperCase();
}

function getPeriodSortValue(period: string) {
  const normalized = normalizePeriod(period);
  const index = periodOrder.indexOf(normalized);
  return index === -1 ? 999 : index;
}

export default function HorariosClient({ groupId }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GroupScheduleItem[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/groups/${groupId}/schedules`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          if (active) setItems([]);
          return;
        }

        const data = (await res.json()) as GroupScheduleItem[];
        if (active) setItems(data);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [groupId]);

  const groupedByDay = useMemo(() => {
    const map = new Map<number, GroupScheduleItem[]>();

    for (const day of dayColumns) {
      map.set(day.value, []);
    }

    for (const item of items) {
      const current = map.get(item.dayOfWeek) ?? [];
      current.push(item);
      map.set(item.dayOfWeek, current);
    }

    for (const [day, dayItems] of map.entries()) {
      map.set(
        day,
        [...dayItems].sort((a, b) => {
          const periodDiff =
            getPeriodSortValue(a.period) - getPeriodSortValue(b.period);

          if (periodDiff !== 0) return periodDiff;

          const startDiff = a.startTime.localeCompare(b.startTime);
          if (startDiff !== 0) return startDiff;

          const endDiff = a.endTime.localeCompare(b.endTime);
          if (endDiff !== 0) return endDiff;

          return a.className.localeCompare(b.className);
        })
      );
    }

    return map;
  }, [items]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para grupo
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Horários do Grupo
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Visualize a agenda semanal formada automaticamente a partir das turmas.
          </p>
        </div>

        <div className="mt-8 overflow-x-auto">
          <div className="grid min-w-[980px] grid-cols-5 gap-4">
            {dayColumns.map((day) => {
              const dayItems = groupedByDay.get(day.value) ?? [];

              return (
                <div
                  key={day.value}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 text-lg font-semibold text-slate-900">
                    {day.label}
                  </div>

                  {loading ? (
                    <div className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-400">
                      Carregando...
                    </div>
                  ) : dayItems.length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-400">
                      Sem horários
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-md bg-sky-100 px-4 py-3"
                        >
                          <div className="text-xs text-slate-500">
                            {item.schoolName}
                          </div>

                          <div className="text-sm font-semibold text-slate-900">
                            {item.className}
                          </div>

                          <div className="text-xs text-slate-700">
                            {item.startTime} - {item.endTime}
                          </div>

                          {item.teacherName ? (
                            <div className="mt-1 text-xs text-slate-500">
                              Professor: {item.teacherName}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
