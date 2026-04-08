import HorariosClient from "./HorariosClient";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupHorariosPage({ params }: PageProps) {
  const { groupId } = await params;

  return <HorariosClient groupId={groupId} />;
}
