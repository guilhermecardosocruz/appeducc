import { NextResponse } from "next/server";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSessionUser } from "@/lib/auth";
import {
  canAccessClassGallery,
  canManageAllClassGalleryImages,
  canUploadToClassGallery,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  buildGalleryObjectKey,
  getR2Client,
  getR2Config,
  getR2SignedUrl,
} from "@/lib/r2";

type RouteContext = {
  params: Promise<{ classId: string }>;
};

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/gif",
]);

const MAX_FILE_SIZE = 8 * 1024 * 1024;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return jsonError("Não autenticado.", 401);
  }

  const { classId } = await context.params;

  const allowed = await canAccessClassGallery(user.id, classId);

  if (!allowed) {
    return jsonError("Sem permissão para acessar a galeria.", 403);
  }

  const canManageAll = await canManageAllClassGalleryImages(user.id, classId);
  const { bucketName } = getR2Config();

  const items = await prisma.classGalleryImage.findMany({
    where: canManageAll
      ? { classId }
      : {
          classId,
          uploadedById: user.id,
        },
    include: {
      uploadedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const mappedItems = await Promise.all(
    items.map(async (item) => {
      const viewUrl = await getR2SignedUrl(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: item.objectKey,
        })
      );

      const downloadUrl = await getR2SignedUrl(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: item.objectKey,
          ResponseContentDisposition: `attachment; filename="${encodeURIComponent(
            item.fileName
          )}"`,
        })
      );

      return {
        id: item.id,
        fileName: item.fileName,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        createdAt: item.createdAt.toISOString(),
        uploadedByName: item.uploadedBy.name,
        canDelete: canManageAll || item.uploadedById === user.id,
        viewUrl,
        downloadUrl,
      };
    })
  );

  return NextResponse.json({
    canUpload: await canUploadToClassGallery(user.id, classId),
    canManageAll,
    items: mappedItems,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return jsonError("Não autenticado.", 401);
  }

  const { classId } = await context.params;

  const canUpload = await canUploadToClassGallery(user.id, classId);

  if (!canUpload) {
    return jsonError("Sem permissão para enviar imagens.", 403);
  }

  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: {
        include: {
          group: true,
        },
      },
    },
  });

  if (!foundClass) {
    return jsonError("Turma não encontrada.", 404);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("Arquivo não enviado.", 400);
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return jsonError("Tipo de arquivo não permitido.", 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return jsonError("A imagem deve ter no máximo 8MB.", 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  const objectKey = buildGalleryObjectKey({
    groupId: foundClass.school.groupId,
    schoolId: foundClass.schoolId,
    classId: foundClass.id,
    schoolName: foundClass.school.name,
    className: foundClass.name,
    originalFileName: file.name,
    uploadedAt: new Date(),
  });

  const client = getR2Client();
  const { bucketName } = getR2Config();

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: body,
      ContentType: file.type,
      ContentLength: file.size,
      Metadata: {
        uploadedById: user.id,
        classId: foundClass.id,
      },
    })
  );

  const created = await prisma.classGalleryImage.create({
    data: {
      classId: foundClass.id,
      uploadedById: user.id,
      objectKey,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });

  const viewUrl = await getR2SignedUrl(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: created.objectKey,
    })
  );

  return NextResponse.json({
    ok: true,
    image: {
      id: created.id,
      fileName: created.fileName,
      viewUrl,
    },
  });
}
