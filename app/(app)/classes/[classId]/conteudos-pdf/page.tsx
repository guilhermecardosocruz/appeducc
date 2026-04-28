import { notFound } from "next/navigation";
import ClassContentsPdfSelectorClient from "@/components/ClassContentsPdfSelectorClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessClass } from "@/lib/permissions";

type PageProps = {
  params: Promise<{ classId: string }>;
};

export default async function ClassConteudosPdfPage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { classId } = await params;

  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
      contents: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!foundClass) {
    notFound();
  }

  const hasAccess = await canAccessClass(user.id, classId);

  if (!hasAccess) {
    notFound();
  }

  const contents = foundClass.contents.map((content) => ({
    id: content.id,
    title: content.title,
  }));

  return (
    <ClassContentsPdfSelectorClient
      classId={classId}
      contents={contents}
    />
  );
}
