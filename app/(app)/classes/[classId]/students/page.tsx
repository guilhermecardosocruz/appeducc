import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import StudentsManagerClient from "@/components/StudentsManagerClient";

type StudentStatus =
  | "ACTIVE"
  | "PENDING_ENTRY"
  | "PENDING_DELETE"
  | "DELETED";

export default async function StudentsPage({
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

  const students = await prisma.student.findMany({
    where: {
      classId,
      status: { not: "DELETED" },
    },
    orderBy: { name: "asc" },
  });

  const initialStudents = students.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status as StudentStatus,
    createdAt: s.createdAt.toISOString(),
    deletedAt: s.deletedAt ? s.deletedAt.toISOString() : null,
    deletedReason: s.deletedReason,
  }));

  const canManageStudents = !user.isTeacher;
  const canImportSpreadsheet = !user.isTeacher;
  const isManager = !user.isTeacher;

  return (
    <StudentsManagerClient
      classId={foundClass.id}
      className={foundClass.name}
      canImportSpreadsheet={canImportSpreadsheet}
      canManageStudents={canManageStudents}
      isManager={isManager}
      initialStudents={initialStudents}
    />
  );
}
