import Link from "next/link";
import { notFound } from "next/navigation";
import CreateAttendanceForm from "@/components/CreateAttendanceForm";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ classId: string }>;
};

function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

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
      students: {
        where: {
          deletedAt: null,
        },
        orderBy: { name: "asc" },
      },
      contents: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!foundClass) {
    notFound();
  }

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId: user.id,
          schoolId: foundClass.schoolId,
        },
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: foundClass.school.groupId,
        },
      },
    }),
  ]);

  const isTeacherOfClass = foundClass.teacherId === user.id;
  const canManage =
    Boolean(schoolMembership) ||
    Boolean(groupMembership && canManageGroupRole(groupMembership.role)) ||
    isTeacherOfClass;

  if (!canManage) {
    notFound();
  }

  const students = foundClass.students.map((student) => ({
    id: student.id,
    name: student.name,
  }));

  const contents = foundClass.contents.map((content) => ({
    id: content.id,
    title: content.title,
  }));

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

        <CreateAttendanceForm
          classId={classId}
          initialLessonDate={getTodayDateInputValue()}
          students={students}
          contents={contents}
        />
      </div>
    </main>
  );
}
