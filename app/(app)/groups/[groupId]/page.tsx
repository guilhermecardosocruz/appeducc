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

  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
  });

  if (!membership) {
    notFound();
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      schools: {
        include: {
          _count: {
            select: { classes: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!group) {
    notFound();
  }

  const schools = group.schools.map((school) => ({
    id: school.id,
    name: school.name,
    createdAt: school.createdAt.toISOString(),
    _count: {
      classes: school._count.classes,
    },
  }));

  return (
    <GroupDetailClient
      groupId={group.id}
      groupName={group.name}
      initialSchools={schools}
    />
  );
}
