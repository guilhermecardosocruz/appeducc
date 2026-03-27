import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ classId: string }>;
};

export default async function ClassConteudosPdfPage({ params }: PageProps) {
  const { classId } = await params;

  const contents = await prisma.content.findMany({
    where: { classId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="min-h-screen bg-white px-8 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href={`/classes/${classId}/conteudos`}
          className="text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          ← Voltar para conteúdos
        </Link>

        <h1 className="mt-6 text-2xl font-semibold">
          Gerar PDF dos conteúdos
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Selecione as aulas que deseja incluir no PDF.
        </p>

        <form
          method="GET"
          action={`/classes/${classId}/conteudos-pdf/print`}
          className="mt-6 space-y-3"
        >
          {contents.map((content) => (
            <label
              key={content.id}
              className="flex items-center gap-3 border p-3"
            >
              <input
                type="checkbox"
                name="contentId"
                value={content.id}
              />
              <span>{content.title}</span>
            </label>
          ))}

          <button
            type="submit"
            className="mt-4 rounded bg-sky-600 px-4 py-2 text-white"
          >
            Gerar PDF
          </button>
        </form>
      </div>
    </main>
  );
}
