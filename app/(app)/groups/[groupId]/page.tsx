import { notFound } from "next/navigation";
import GroupDetailClient from "@/components/GroupDetailClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupPage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { groupId } = await params;

  const [groupMembership, schoolMembershipsInGroup, group] = await Promise.all([
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId,
        },
      },
    }),
    prisma.schoolMember.findMany({
      where: {
        userId: user.id,
        school: {
          groupId,
        },
      },
      select: {
        schoolId: true,
        role: true,
      },
    }),
    prisma.group.findUnique({
      where: { id: groupId },
      include: {
        schools: {
          include: {
            _count: {
              select: { classes: true },
            },
          },
          orderBy: { name: "asc" },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
                isTeacher: true,
                createdAt: true,
              },
            },
          },
          orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        },
      },
    }),
  ]);

  if (!group) {
    notFound();
  }

  const hasAccess =
    Boolean(groupMembership) || schoolMembershipsInGroup.length > 0;

  if (!hasAccess) {
    notFound();
  }

  const canManageMembers =
    groupMembership?.role === "OWNER" || groupMembership?.role === "MANAGER";

  const allowedSchoolIds = groupMembership
    ? null
    : new Set(schoolMembershipsInGroup.map((item) => item.schoolId));

  const schools = group.schools
    .filter((school) => {
      if (!allowedSchoolIds) return true;
      return allowedSchoolIds.has(school.id);
    })
    .map((school) => ({
      id: school.id,
      name: school.name,
      createdAt: school.createdAt.toISOString(),
      _count: {
        classes: school._count.classes,
      },
    }));

  const members = group.members.map((item) => ({
    userId: item.user.id,
    name: item.user.name,
    email: item.user.email,
    cpf: item.user.cpf,
    isTeacher: item.user.isTeacher,
    role: item.role,
    memberSince: item.createdAt.toISOString(),
    createdAt: item.user.createdAt.toISOString(),
  }));

  return (
    <GroupDetailClient
      groupId={group.id}
      groupName={group.name}
      initialSchools={schools}
      initialMembers={members}
      canManageMembers={canManageMembers}
      currentUserId={user.id}
    />
  );
}
