"use client";

import { useMemo, useState } from "react";

type CreatedMemberResponse = {
  member: {
    userId: string;
    name: string;
    email: string;
    cpf: string | null;
    isTeacher: boolean;
    role: string;
    canManageSchools: boolean;
    memberSince: string;
    createdAt: string;
  };
  temporaryPassword: string | null;
  createdUser: boolean;
};

type ErrorResponse = {
  error?: string;
};

type Props = {
  groupId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export default function ManageGroupMembersModal({
  groupId,
  open,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [role, setRole] = useState<"MANAGER" | "VIEWER">("VIEWER");
  const [canManageSchools, setCanManageSchools] = useState(false);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedMemberResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roleDescription = useMemo(() => {
    if (role === "MANAGER") {
      return "Pode ajudar na administração do grupo.";
    }

    return "Acompanha informações do grupo sem alterar dados.";
  }, [role]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage("Informe pelo menos o e-mail.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          cpf,
          role,
          canManageSchools,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as ErrorResponse;
        setErrorMessage(data.error ?? "Erro ao adicionar membro.");
        return;
      }

      const data = (await res.json()) as CreatedMemberResponse;
      setCreated(data);
      setName("");
      setEmail("");
      setCpf("");
      setRole("VIEWER");
      setCanManageSchools(false);
      onCreated();
    } catch (error) {
      console.error("Erro ao adicionar membro do grupo", error);
      setErrorMessage("Erro ao adicionar membro.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setName("");
    setEmail("");
    setCpf("");
    setRole("VIEWER");
    setCanManageSchools(false);
    setCreated(null);
    setErrorMessage(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        {!created ? (
          <>
            <h2 className="text-lg font-semibold text-slate-900">
              Gerenciar equipe do grupo
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Informe o e-mail. Se a pessoa já existir no sistema, ela será apenas
              vinculada ao grupo. Se não existir, uma nova conta será criada.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ex: gestor@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                Se o e-mail ainda não existir, os campos abaixo serão usados para
                criar a nova conta.
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Nome completo
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ex: Maria da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  CPF
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ex: 111.111.111-11"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Tipo de acesso
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "MANAGER" | "VIEWER")}
                >
                  <option value="VIEWER">Acompanhamento</option>
                  <option value="MANAGER">Gestor do grupo</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">{roleDescription}</p>
              </div>

              <label className="flex items-start gap-3 rounded-md border border-slate-200 p-3">
                <input
                  type="checkbox"
                  checked={canManageSchools}
                  onChange={(e) => setCanManageSchools(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm text-slate-700">
                  Dar acesso automático de gestão das escolas do grupo
                  <span className="mt-1 block text-xs text-slate-500">
                    Neste primeiro passo, vamos apenas salvar essa configuração no
                    grupo para usar nas próximas regras de escola.
                  </span>
                </span>
              </label>

              {errorMessage ? (
                <p className="text-sm text-red-600">{errorMessage}</p>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300"
                  disabled={loading}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Adicionar ao grupo"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-900">
              Membro adicionado ao grupo
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {created.createdUser
                ? "Uma nova conta foi criada e vinculada ao grupo."
                : "Usuário existente vinculado ao grupo com sucesso."}
            </p>

            <div className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Nome
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {created.member.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  E-mail
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {created.member.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Papel no grupo
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {created.member.role === "MANAGER" ? "Gestor do grupo" : "Acompanhamento"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Gestão das escolas
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {created.member.canManageSchools ? "Sim" : "Não"}
                </p>
              </div>

              {created.temporaryPassword ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Senha inicial
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {created.temporaryPassword}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
