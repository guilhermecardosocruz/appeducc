import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GroupContentsClient from "@/components/GroupContentsClient";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupContentsPage({ params }: PageProps) {
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

  const contentsRaw = await prisma.groupContent.findMany({
    where: { groupId },
    orderBy: { createdAt: "asc" },
  });

  const contents = contentsRaw.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description ?? undefined,
    objectives: c.objectives ?? undefined,
    methodology: c.methodology ?? undefined,
    resources: c.resources ?? undefined,
    bncc: c.bncc ?? undefined,
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para grupo
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">
          Conteúdos do grupo
        </h1>

        <GroupContentsClient
          initialContents={contents}
          groupId={groupId}
        />
      </div>
    </main>
  );
}
