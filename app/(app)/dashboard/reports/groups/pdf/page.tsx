import { notFound } from "next/navigation";
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

export default async function DashboardGroupsPdfPage({
  searchParams,
}: PageProps) {
  const user = await getSessionUser();
  if (!user) notFound();

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

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Relatório Geral (Grupos)</h1>

      <p>Grupos: {summary.groups}</p>
      <p>Escolas: {summary.schools}</p>
      <p>Turmas: {summary.classes}</p>
      <p>Alunos: {summary.students}</p>
      <p>Presença: {presenceRate}%</p>

      <hr style={{ margin: "20px 0" }} />

      <table width="100%" border={1} cellPadding={6} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Grupo</th>
            <th>Escolas</th>
            <th>Turmas</th>
            <th>Alunos</th>
            <th>Presença %</th>
          </tr>
        </thead>
        <tbody>
          {data.map((g) => (
            <tr key={g.groupId}>
              <td>{g.groupName}</td>
              <td>{g.schools}</td>
              <td>{g.classes}</td>
              <td>{g.students}</td>
              <td>{g.presenceRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
