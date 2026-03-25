import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SchoolReportsClient from "@/components/SchoolReportsClient";

type PageProps = {
  params: Promise<{ schoolId: string }>;
};

export default async function SchoolReportsPage({ params }: PageProps) {
  const user = await getSessionUser();
  if (!user) notFound();

  const { schoolId } = await params;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) notFound();

  return <SchoolReportsClient schoolId={schoolId} />;
}
