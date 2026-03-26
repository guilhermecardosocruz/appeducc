import Link from "next/link";
import { notFound } from "next/navigation";
import ContentPlanDetailClient from "@/components/ContentPlanDetailClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ groupId: string; planId: string }>;
};

export default async function ContentPlanDetailPage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { groupId, planId } = await params;

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

  const plan = await prisma.contentPlan.findFirst({
    where: {
      id: planId,
      groupId,
    },
    include: {
      lessons: {
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      },
      _count: {
        select: {
          lessons: true,
          classLinks: true,
        },
      },
    },
  });

  if (!plan) {
    notFound();
  }

  const lessons = plan.lessons.map((lesson) => ({
    id: lesson.id,
    orderIndex: lesson.orderIndex,
    title: lesson.title,
    objectives: lesson.objectives ?? undefined,
    methodology: lesson.methodology ?? undefined,
    resources: lesson.resources ?? undefined,
    bncc: lesson.bncc ?? undefined,
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}/content-plans`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para planejamentos
          </Link>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">{plan.name}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {plan.description || "Sem descrição."}
          </p>
          <p className="mt-3 text-sm text-slate-500">
            {plan._count.lessons} aula(s) • {plan._count.classLinks} turma(s)
            vinculada(s)
          </p>
        </div>

        <ContentPlanDetailClient
          groupId={groupId}
          planId={planId}
          initialLessons={lessons}
        />
      </div>
    </main>
  );
}
