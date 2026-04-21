import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type PageProps = {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
};

function parseStartDate(value?: string) {
  if (!value) return null;
  const d = new Date(value + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function parseEndDate(value?: string) {
  if (!value) return null;
  const d = new Date(value + "T23:59:59.999");
  return isNaN(d.getTime()) ? null : d;
}

export default async function Page({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (!user) return null;

  const { startDate, endDate } = await searchParams;

  const start = parseStartDate(startDate);
  const end = parseEndDate(endDate);

  const groups = await prisma.group.findMany({
    where: {
      OR: [
        { members: { some: { userId: user.id } } },
        {
          schools: {
            some: {
              members: { some: { userId: user.id } },
            },
          },
        },
        {
          schools: {
            some: {
              classes: { some: { teacherId: user.id } },
            },
          },
        },
      ],
    },
    include: {
      schools: {
        include: {
          classes: {
            include: {
              students: {
                where: { status: "ACTIVE", deletedAt: null },
              },
              attendances: {
                include: {
                  presences: {
                    include: {
                      student: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const data = groups.map((group) => {
    let students = 0;
    let presences = 0;
    let absences = 0;
    let attendances = 0;
    let classes = 0;

    group.schools.forEach((school) => {
      school.classes.forEach((cls) => {
        students += cls.students.length;
        classes += 1;

        cls.attendances.forEach((att) => {
          const date = new Date(att.lessonDate);

          if (start && date < start) return;
          if (end && date > end) return;

          attendances++;

          att.presences.forEach((p) => {
            // ✅ FIX CRÍTICO
            if (!p.student) return;
            if (p.student.deletedAt) return;
            if (p.student.status !== "ACTIVE") return;

            if (p.present) presences++;
            else absences++;
          });
        });
      });
    });

    const total = presences + absences;

    return {
      id: group.id,
      name: group.name,
      schools: group.schools.length,
      classes,
      students,
      presenceRate: total > 0 ? ((presences / total) * 100).toFixed(2) : "0",
      avgPresence: attendances > 0 ? (presences / attendances).toFixed(2) : "0",
      avgAbsence: attendances > 0 ? (absences / attendances).toFixed(2) : "0",
    };
  });

  const summary = data.reduce(
    (acc, g) => {
      acc.groups++;
      acc.schools += g.schools;
      acc.classes += g.classes;
      acc.students += g.students;
      return acc;
    },
    { groups: 0, schools: 0, classes: 0, students: 0 }
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        <Link href="/dashboard">← Voltar</Link>

        <h1 className="text-2xl font-semibold mt-4">
          Relatório Geral (Grupos)
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 border bg-white">Grupos: {summary.groups}</div>
          <div className="p-4 border bg-white">Escolas: {summary.schools}</div>
          <div className="p-4 border bg-white">Turmas: {summary.classes}</div>
          <div className="p-4 border bg-white">Alunos: {summary.students}</div>
        </div>

        <div className="mt-8 border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th>Grupo</th>
                <th>Escolas</th>
                <th>Turmas</th>
                <th>Alunos</th>
                <th>% Presença</th>
                <th>Média Presença</th>
                <th>Média Faltas</th>
              </tr>
            </thead>
            <tbody>
              {data.map((g) => (
                <tr key={g.id} className="border-t">
                  <td>{g.name}</td>
                  <td>{g.schools}</td>
                  <td>{g.classes}</td>
                  <td>{g.students}</td>
                  <td>{g.presenceRate}%</td>
                  <td>{g.avgPresence}</td>
                  <td>{g.avgAbsence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}
