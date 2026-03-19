import { notFound } from "next/navigation";
import StudentsManagerClient from "@/components/StudentsManagerClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ classId: string }>;
};

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

  const students = foundClass.students.map((student) => ({
    id: student.id,
    name: student.name,
    createdAt: student.createdAt.toISOString(),
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
