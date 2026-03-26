import Link from "next/link";
import { notFound } from "next/navigation";
import ContentPlansClient from "@/components/ContentPlansClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupContentPlansPage({ params }: PageProps) {
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

  const plansRaw = await prisma.contentPlan.findMany({
    where: { groupId },
    include: {
      _count: {
        select: {
          lessons: true,
          classLinks: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const plans = plansRaw.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? undefined,
    _count: item._count,
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

        <ContentPlansClient
          groupId={groupId}
          initialPlans={plans}
        />
      </div>
    </main>
  );
}
