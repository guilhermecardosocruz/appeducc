import Link from "next/link";
import { notFound } from "next/navigation";
import CreateAttendanceForm from "@/components/CreateAttendanceForm";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ classId: string }>;
};

export default async function NewAttendancePage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { classId } = await params;

  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
    },
  });

  if (!foundClass) {
    notFound();
  }

  const membership = await prisma.schoolMember.findUnique({
    where: {
      userId_schoolId: {
        userId: user.id,
        schoolId: foundClass.schoolId,
      },
    },
  });

  if (!membership) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/classes/${classId}/chamadas`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para chamadas
          </Link>
        </div>

        <CreateAttendanceForm classId={classId} />
      </div>
    </main>
  );
}
