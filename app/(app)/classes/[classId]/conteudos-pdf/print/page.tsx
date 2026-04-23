import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canAccessClass } from "@/lib/permissions";
import PrintContentsClient from "@/components/PrintContentsClient";

type PageProps = {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ contentId?: string | string[] }>;
};

export default async function PrintPage({
  params,
  searchParams,
}: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { classId } = await params;
  const sp = await searchParams;

  // 🔥 valida acesso à turma
  const hasAccess = await canAccessClass(user.id, classId);

  if (!hasAccess) {
    notFound();
  }

  const ids = Array.isArray(sp.contentId)
    ? sp.contentId
    : sp.contentId
    ? [sp.contentId]
    : [];

  const contents = await prisma.content.findMany({
    where: {
      classId,
      id: { in: ids },
    },
    orderBy: { createdAt: "asc" },
  });

  return <PrintContentsClient contents={contents} />;
}
