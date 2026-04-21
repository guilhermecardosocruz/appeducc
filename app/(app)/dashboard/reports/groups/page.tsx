import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

type GroupReport = {
  groupId: string;
  groupName: string;
  schools: number;
  classes: number;
  students: number;
  totalAttendances: number;
  presences: number;
  absences: number;
  presenceRate: number;
};

type PageProps = {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
};

export default async function DashboardGroupsReportPage({
  searchParams,
}: PageProps) {
  const user = await getSessionUser();
  if (!user) return null;

  const { startDate = "", endDate = "" } = await searchParams;

  const query = new URLSearchParams();
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/dashboard/reports/groups?${query.toString()}`,
    { cache: "no-store" }
  );

  const data = (await res.json()) as GroupReport[];

  const summary = data.reduce(
    (acc, g) => {
      acc.groups += 1;
      acc.schools += g.schools;
      acc.classes += g.classes;
      acc.students += g.students;
      acc.attendances += g.totalAttendances;
      acc.presences += g.presences;
      acc.absences += g.absences;
      return acc;
    },
    {
      groups: 0,
      schools: 0,
      classes: 0,
      students: 0,
      attendances: 0,
      presences: 0,
      absences: 0,
    }
  );

  const total = summary.presences + summary.absences;
  const presenceRate =
    total > 0 ? ((summary.presences / total) * 100).toFixed(2) : "0";

  const pdfLink = `/dashboard/reports/groups/pdf?startDate=${startDate}&endDate=${endDate}`;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">

        <Link href="/dashboard" className="text-sm text-sky-700">
          ← Voltar
        </Link>

        <h1 className="text-2xl font-semibold mt-4">
          Relatório Geral (Grupos)
        </h1>

        {/* FILTRO */}
        <form className="mt-4 flex gap-2">
          <input name="startDate" type="date" defaultValue={startDate} />
          <input name="endDate" type="date" defaultValue={endDate} />

          <button className="bg-sky-600 text-white px-4 py-2 rounded">
            Aplicar
          </button>

          <Link href={pdfLink} className="border px-4 py-2 rounded">
            PDF
          </Link>
        </form>

        {/* CARDS */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-slate-500">Grupos</p>
            <p className="text-xl font-semibold">{summary.groups}</p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-slate-500">Escolas</p>
            <p className="text-xl font-semibold">{summary.schools}</p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-slate-500">Turmas</p>
            <p className="text-xl font-semibold">{summary.classes}</p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-slate-500">Alunos</p>
            <p className="text-xl font-semibold">{summary.students}</p>
          </div>

          {/* 🔥 NOVO USO DO presenceRate */}
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-slate-500">% Presença</p>
            <p className="text-xl font-semibold">{presenceRate}%</p>
          </div>

        </div>

        {/* TABELA */}
        <div className="mt-8 overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Grupo</th>
                <th className="px-4 py-3 text-left">Escolas</th>
                <th className="px-4 py-3 text-left">Turmas</th>
                <th className="px-4 py-3 text-left">Alunos</th>
                <th className="px-4 py-3 text-left">% Presença</th>
              </tr>
            </thead>
            <tbody>
              {data.map((g) => (
                <tr key={g.groupId} className="border-t">
                  <td className="px-4 py-3 font-medium">{g.groupName}</td>
                  <td className="px-4 py-3">{g.schools}</td>
                  <td className="px-4 py-3">{g.classes}</td>
                  <td className="px-4 py-3">{g.students}</td>
                  <td className="px-4 py-3">{g.presenceRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}
