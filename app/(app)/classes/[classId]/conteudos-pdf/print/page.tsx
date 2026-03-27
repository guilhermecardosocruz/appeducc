import { prisma } from "@/lib/prisma";
import PrintContentsClient from "@/components/PrintContentsClient";

type PageProps = {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ contentId?: string | string[] }>;
};

export default async function PrintPage({
  params,
  searchParams,
}: PageProps) {
  const { classId } = await params;
  const sp = await searchParams;

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
