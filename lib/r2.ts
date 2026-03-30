import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getR2Config() {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");
  const bucketName = requireEnv("R2_BUCKET_NAME");
  const endpoint = requireEnv("R2_ENDPOINT");

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
  };
}

export function getR2Client() {
  const config = getR2Config();

  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function getR2SignedUrl(
  command: GetObjectCommand,
  expiresIn = 60 * 10
) {
  const client = getR2Client();
  return getSignedUrl(client, command, { expiresIn });
}

export function sanitizePathPart(input: string) {
  return String(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function buildGalleryObjectKey(params: {
  groupId: string;
  schoolId: string;
  classId: string;
  schoolName: string;
  className: string;
  originalFileName: string;
  uploadedAt?: Date;
}) {
  const now = params.uploadedAt ?? new Date();
  const ext = params.originalFileName.includes(".")
    ? params.originalFileName.split(".").pop()?.toLowerCase() ?? "jpg"
    : "jpg";

  const schoolPart = sanitizePathPart(params.schoolName) || "escola";
  const classPart = sanitizePathPart(params.className) || "turma";
  const datePart = now.toISOString().replace(/[:.]/g, "-");

  return [
    "groups",
    sanitizePathPart(params.groupId),
    "schools",
    sanitizePathPart(params.schoolId),
    "classes",
    sanitizePathPart(params.classId),
    "gallery",
    `${schoolPart}_${classPart}_${datePart}.${ext}`,
  ].join("/");
}
