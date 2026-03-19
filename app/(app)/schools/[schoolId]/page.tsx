import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SchoolDetailClient from "@/components/SchoolDetailClient";

type PageProps = {
  params: Promise<{ schoolId: string }>;
};

export default async function SchoolPage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { schoolId } = await params;

  const membership = await prisma.schoolMember.findUnique({
    where: {
      userId_schoolId: {
        userId: user.id,
        schoolId,
      },
    },
  });

  if (!membership) {
    notFound();
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      group: true,
      classes: {
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { students: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!school) {
    notFound();
  }

  const teachersRaw = await prisma.user.findMany({
    where: {
      createdById: user.id,
      isTeacher: true,
    },
    orderBy: { name: "asc" },
  });

  const teachers = teachersRaw.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
  }));

  const classes = school.classes.map((item) => ({
    id: item.id,
    name: item.name,
    year: item.year,
    createdAt: item.createdAt.toISOString(),
    teacher: item.teacher
      ? {
          id: item.teacher.id,
          name: item.teacher.name,
          email: item.teacher.email,
        }
      : null,
    _count: {
      students: item._count.students,
    },
  }));

  return (
    <SchoolDetailClient
      schoolId={school.id}
      schoolName={school.name}
      groupId={school.groupId}
      teachers={teachers}
      initialClasses={classes}
    />
  );
}
