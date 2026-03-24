import { notFound } from "next/navigation";
import StudentsManagerClient from "@/components/StudentsManagerClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ classId: string }>;
};

function isManagerRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return ["OWNER", "MANAGER"].includes(normalized);
}

export default async function ClassStudentsPage({ params }: PageProps) {
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
        orderBy: { name: "asc" },
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

  const hasAccess =
    Boolean(schoolMembership) ||
    Boolean(groupMembership && isManagerRole(groupMembership.role));

  if (!hasAccess) {
    notFound();
  }

  const students = foundClass.students.map((student) => ({
    id: student.id,
    name: student.name,
    status: student.status as "ACTIVE" | "PENDING_DELETE" | "DELETED",
    createdAt: student.createdAt.toISOString(),
    deletedAt: student.deletedAt?.toISOString() ?? null,
    deletedReason: student.deletedReason ?? null,
  }));

  return (
    <StudentsManagerClient
      classId={foundClass.id}
      className={foundClass.name}
      canImportSpreadsheet={!user.isTeacher}
      initialStudents={students}
    />
  );
}
