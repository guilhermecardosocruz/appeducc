import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSessionUser } from "@/lib/auth";
import { canManageAllClassGalleryImages } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getR2Client, getR2Config } from "@/lib/r2";

type RouteContext = {
  params: Promise<{ classId: string; imageId: string }>;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return jsonError("Não autenticado.", 401);
  }

  const { classId, imageId } = await context.params;

  const image = await prisma.classGalleryImage.findFirst({
    where: {
      id: imageId,
      classId,
    },
  });

  if (!image) {
    return jsonError("Imagem não encontrada.", 404);
  }

  const canManageAll = await canManageAllClassGalleryImages(user.id, classId);
  const canDeleteOwn = image.uploadedById === user.id;

  if (!canManageAll && !canDeleteOwn) {
    return jsonError("Sem permissão para excluir esta imagem.", 403);
  }

  const client = getR2Client();
  const { bucketName } = getR2Config();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: image.objectKey,
    })
  );

  await prisma.classGalleryImage.delete({
    where: {
      id: image.id,
    },
  });

  return NextResponse.json({ ok: true });
}
