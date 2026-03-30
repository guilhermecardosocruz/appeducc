"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type GalleryItem = {
  id: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  uploadedByName: string;
  canDelete: boolean;
  viewUrl: string;
  downloadUrl: string;
};

type GalleryResponse = {
  canUpload: boolean;
  canManageAll: boolean;
  items: GalleryItem[];
};

type Props = {
  classId: string;
  className: string;
  schoolId: string;
};

function formatBytes(value: number | null) {
  if (!value || Number.isNaN(value)) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

export default function ClassGalleryClient({
  classId,
  className,
  schoolId,
}: Props) {
  const [data, setData] = useState<GalleryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/classes/${classId}/gallery`, {
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Não foi possível carregar a galeria.");
      }

      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar galeria.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void loadGallery();
  }, [loadGallery]);

  const hasImages = useMemo(() => Boolean(data?.items?.length), [data]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Selecione uma imagem para enviar.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("description", description);

      const response = await fetch(`/api/classes/${classId}/gallery`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Não foi possível enviar a imagem.");
      }

      setDescription("");
      setSelectedFile(null);

      const input = document.getElementById(
        "class-gallery-file"
      ) as HTMLInputElement | null;
      if (input) input.value = "";

      await loadGallery();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(imageId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta imagem?"
    );

    if (!confirmed) return;

    setDeletingId(imageId);
    setError("");

    try {
      const response = await fetch(
        `/api/classes/${classId}/gallery/${imageId}`,
        {
          method: "DELETE",
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Não foi possível excluir a imagem.");
      }

      await loadGallery();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir imagem.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href={`/classes/${classId}`}
              className="text-sm font-medium text-sky-700 hover:text-sky-800"
            >
              ← Voltar para turma
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">
              Galeria — {className}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              As imagens ficam privadas e são exibidas somente para o professor
              responsável e para gestores autorizados.
            </p>
          </div>

          <Link
            href={`/schools/${schoolId}`}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver turmas
          </Link>
        </div>

        {error ? (
          <div className="mb-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {data?.canUpload ? (
          <form
            onSubmit={handleUpload}
            className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              Enviar nova imagem
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Envie somente imagens autorizadas da turma.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="class-gallery-file"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Imagem
                </label>
                <input
                  id="class-gallery-file"
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] ?? null)
                  }
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-sky-700"
                />
              </div>

              <div>
                <label
                  htmlFor="class-gallery-description"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Observação opcional
                </label>
                <input
                  id="class-gallery-description"
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ex.: atividade de robótica"
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>

            <div className="mt-5">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Enviar imagem"}
              </button>
            </div>
          </form>
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Imagens</h2>
              <p className="mt-2 text-sm text-slate-500">
                {data?.canManageAll
                  ? "Você está vendo todas as imagens desta turma."
                  : "Você está vendo somente as imagens enviadas por você."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadGallery()}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Atualizar
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Carregando galeria...
            </div>
          ) : !hasImages ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Nenhuma imagem enviada ainda.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data?.items.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  <a
                    href={item.viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block bg-slate-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.viewUrl}
                      alt={item.fileName}
                      className="h-56 w-full object-cover"
                    />
                  </a>

                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="break-all text-sm font-semibold text-slate-900">
                        {item.fileName}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Enviado por {item.uploadedByName}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="font-medium text-slate-700">Data:</span>{" "}
                        {formatDate(item.createdAt)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Tamanho:</span>{" "}
                        {formatBytes(item.sizeBytes)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={item.viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Abrir
                      </a>

                      <a
                        href={item.downloadUrl}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Download
                      </a>

                      {item.canDelete ? (
                        <button
                          type="button"
                          onClick={() => void handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded-md bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === item.id ? "Excluindo..." : "Excluir"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
