import { notFound } from "next/navigation";
import ClassGalleryClient from "@/components/ClassGalleryClient";
import { getSessionUser } from "@/lib/auth";
import { canAccessClassGallery } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ classId: string }>;
};

export default async function ClassGalleryPage({ params }: PageProps) {
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

  const allowed = await canAccessClassGallery(user.id, classId);

  if (!allowed) {
    notFound();
  }

  return (
    <ClassGalleryClient
      classId={foundClass.id}
      className={foundClass.name}
      schoolId={foundClass.schoolId}
    />
  );
}
