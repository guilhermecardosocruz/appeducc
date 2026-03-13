import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClassDetailClient from "@/components/ClassDetailClient";

type PageProps = {
  params: Promise<{ classId: string }>;
};

export default async function ClassPage({ params }: PageProps) {
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
    <ClassDetailClient
      classId={foundClass.id}
      className={foundClass.name}
      schoolId={foundClass.schoolId}
    />
  );
}
