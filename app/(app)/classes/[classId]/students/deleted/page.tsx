import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export default async function DeletedStudentsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  const user = await getSessionUser();
  if (!user) return null;

  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!foundClass) return null;

  const deletedStudents = await prisma.deletedStudentArchive.findMany({
    where: { classId },
    include: {
      deletedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      exitDate: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <Link href={`/classes/${classId}/students`} className="text-sky-700">
            ← Voltar para alunos
          </Link>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-4">
            Alunos excluídos — {foundClass.name}
          </h1>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border px-3 py-2 text-left">Nome</th>
                  <th className="border px-3 py-2 text-left">Entrada</th>
                  <th className="border px-3 py-2 text-left">Saída</th>
                  <th className="border px-3 py-2 text-left">Frequência</th>
                  <th className="border px-3 py-2 text-left">Motivo</th>
                  <th className="border px-3 py-2 text-left">Excluído por</th>
                </tr>
              </thead>
              <tbody>
                {deletedStudents.map((s) => (
                  <tr key={s.id}>
                    <td className="border px-3 py-2">{s.name}</td>
                    <td className="border px-3 py-2">
                      {s.entryDate
                        ? new Date(s.entryDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="border px-3 py-2">
                      {new Date(s.exitDate).toLocaleDateString()}
                    </td>
                    <td className="border px-3 py-2">
                      {s.attendancePercentage
                        ? `${s.attendancePercentage.toFixed(1)}%`
                        : "-"}
                    </td>
                    <td className="border px-3 py-2">
                      {s.exitReason || "-"}
                    </td>
                    <td className="border px-3 py-2">
                      {s.deletedBy?.name || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {deletedStudents.length === 0 && (
              <p className="text-sm text-slate-500 mt-4">
                Nenhum aluno excluído permanentemente.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
