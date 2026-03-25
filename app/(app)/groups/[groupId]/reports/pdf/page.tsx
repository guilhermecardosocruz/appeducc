import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import GroupReportsPdfClient from "@/components/GroupReportsPdfClient";

type PageProps = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
};

export default async function GroupReportsPdfPage({
  params,
  searchParams,
}: PageProps) {
  const user = await getSessionUser();
  if (!user) notFound();

  const { groupId } = await params;
  const { startDate = "", endDate = "" } = await searchParams;

  return (
    <GroupReportsPdfClient
      groupId={groupId}
      startDate={startDate}
      endDate={endDate}
    />
  );
}
