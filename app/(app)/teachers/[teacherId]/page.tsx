import { notFound } from "next/navigation";
import TeacherDetailClient from "@/components/TeacherDetailClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ teacherId: string }>;
};

export default async function TeacherPage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { teacherId } = await params;

  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      createdById: user.id,
      isTeacher: true,
    },
  });

  if (!teacher) {
    notFound();
  }

  const linkedClassesRaw = await prisma.class.findMany({
    where: {
      teacherId: teacher.id,
    },
    include: {
      school: {
        include: {
          group: true,
        },
      },
    },
    orderBy: [{ school: { name: "asc" } }, { name: "asc" }],
  });

  const availableClassesRaw = await prisma.class.findMany({
    where: {
      teacherId: null,
      school: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    },
    include: {
      school: {
        include: {
          group: true,
        },
      },
    },
    orderBy: [{ school: { name: "asc" } }, { name: "asc" }],
  });

  const linkedClasses = linkedClassesRaw.map((item) => ({
    id: item.id,
    name: item.name,
    year: item.year,
    school: {
      id: item.school.id,
      name: item.school.name,
      group: {
        id: item.school.group.id,
        name: item.school.group.name,
      },
    },
  }));

  const availableClasses = availableClassesRaw.map((item) => ({
    id: item.id,
    name: item.name,
    year: item.year,
    school: {
      id: item.school.id,
      name: item.school.name,
      group: {
        id: item.school.group.id,
        name: item.school.group.name,
      },
    },
  }));

  return (
    <TeacherDetailClient
      teacherId={teacher.id}
      teacherName={teacher.name}
      teacherEmail={teacher.email}
      teacherCpf={teacher.cpf}
      linkedClasses={linkedClasses}
      availableClasses={availableClasses}
    />
  );
}
