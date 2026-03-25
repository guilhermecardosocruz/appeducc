import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SchoolDetailClient from "@/components/SchoolDetailClient";

type PageProps = {
  params: Promise<{ schoolId: string }>;
};

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

function canManageSchoolMembership(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized !== "" && normalized !== "TEACHER";
}

export default async function SchoolPage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { schoolId } = await params;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      group: true,
    },
  });

  if (!school) {
    notFound();
  }

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId: user.id,
          schoolId,
        },
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: school.groupId,
        },
      },
    }),
  ]);

  const hasAccess = Boolean(schoolMembership) || Boolean(groupMembership);

  if (!hasAccess) {
    notFound();
  }

  const canManageSchool =
    Boolean(
      schoolMembership && canManageSchoolMembership(schoolMembership.role)
    ) ||
    Boolean(groupMembership && canManageGroupRole(groupMembership.role));

  let classesRaw;

  if (user.isTeacher) {
    classesRaw = await prisma.class.findMany({
      where: {
        schoolId,
        teacherId: user.id,
      },
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
      orderBy: { name: "asc" },
    });
  } else {
    classesRaw = await prisma.class.findMany({
      where: { schoolId },
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
      orderBy: { name: "asc" },
    });
  }

  const teachersRaw = await prisma.user.findMany({
    where: {
      OR: [
        {
          createdById: user.id,
          isTeacher: true,
        },
        {
          schoolMembers: {
            some: {
              schoolId,
              role: "TEACHER",
            },
          },
        },
      ],
    },
    orderBy: { name: "asc" },
  });

  const teacherMap = new Map(
    teachersRaw.map((teacher) => [
      teacher.id,
      {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
      },
    ])
  );

  const teachers = Array.from(teacherMap.values());

  const classes = classesRaw.map((item) => ({
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
      canManageSchool={canManageSchool}
    />
  );
}
