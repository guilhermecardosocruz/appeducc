import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import SchoolReportsPdfClient from "@/components/SchoolReportsPdfClient";

type PageProps = {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
};

export default async function SchoolReportsPdfPage({
  params,
  searchParams,
}: PageProps) {
  const user = await getSessionUser();
  if (!user) notFound();

  const { schoolId } = await params;
  const { startDate = "", endDate = "" } = await searchParams;

  return (
    <SchoolReportsPdfClient
      schoolId={schoolId}
      startDate={startDate}
      endDate={endDate}
    />
  );
}
