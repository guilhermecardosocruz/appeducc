"use client";

import { useMemo, useState } from "react";

type GroupMemberItem = {
  userId: string;
  name: string;
  email: string;
  cpf: string | null;
  isTeacher: boolean;
  role: string;
  memberSince: string;
  createdAt: string;
};

type CreatedMemberResponse = {
  member: {
    userId: string;
    name: string;
    email: string;
    cpf: string | null;
    isTeacher: boolean;
    role: string;
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
  members: GroupMemberItem[];
  currentUserId: string;
  onRemoveMember: (memberUserId: string, memberName: string, role: string) => Promise<void>;
};

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function getRoleLabel(role: string) {
  if (role === "OWNER") return "Criador";
  if (role === "MANAGER") return "Gestor do grupo";
  if (role === "VIEWER") return "Somente visualização";
  return role;
}

export default function ManageGroupMembersModal({
  groupId,
  open,
  onClose,
  onCreated,
  members,
  currentUserId,
  onRemoveMember,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [role, setRole] = useState<"MANAGER" | "VIEWER">("VIEWER");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedMemberResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const roleDescription = useMemo(() => {
    if (role === "MANAGER") {
      return "Terá os mesmos poderes de gestão do criador do grupo, exceto o papel de OWNER.";
    }

    return "Poderá visualizar o grupo, escolas, turmas e informações, sem editar.";
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
      await onCreated();
    } catch (error) {
      console.error("Erro ao adicionar membro do grupo", error);
      setErrorMessage("Erro ao adicionar membro.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(memberUserId: string, memberName: string, role: string) {
    setRemovingUserId(memberUserId);
    try {
      await onRemoveMember(memberUserId, memberName, role);
    } finally {
      setRemovingUserId(null);
    }
  }

  function handleClose() {
    setName("");
    setEmail("");
    setCpf("");
    setRole("VIEWER");
    setCreated(null);
    setErrorMessage(null);
    setRemovingUserId(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Compartilhar gestão do grupo
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Gerencie os acessos do grupo sem ocupar espaço da tela principal.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="grid flex-1 gap-0 overflow-hidden md:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-y-auto border-b border-slate-200 p-6 md:border-b-0 md:border-r">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Gestão do grupo
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Pessoas com acesso administrativo ou visual a este grupo.
              </p>
            </div>

            {members.length === 0 ? (
              <p className="text-sm text-slate-500">
                Ainda não há membros vinculados a este grupo.
              </p>
            ) : (
              <ul className="space-y-3">
                {members.map((member) => (
                  <li
                    key={member.userId}
                    className="rounded-md border border-slate-200 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {member.name}
                          {member.userId === currentUserId ? (
                            <span className="ml-2 text-xs text-slate-500">(você)</span>
                          ) : null}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {member.email}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                            {getRoleLabel(member.role)}
                          </span>
                        </div>
                      </div>

                      {member.role !== "OWNER" ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemove(member.userId, member.name, member.role)
                          }
                          disabled={removingUserId === member.userId}
                          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {removingUserId === member.userId ? "Removendo..." : "Remover"}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-y-auto p-6">
            {!created ? (
              <>
                <h3 className="text-base font-semibold text-slate-900">
                  Compartilhar acesso
                </h3>
                <p className="mt-1 text-sm text-slate-500">
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
                      <option value="VIEWER">Somente visualização</option>
                      <option value="MANAGER">Gestor do grupo</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">{roleDescription}</p>
                  </div>

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
                      {loading ? "Compartilhando..." : "Compartilhar"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-slate-900">
                  Acesso compartilhado com sucesso
                </h3>
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
                      Tipo de acesso
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {created.member.role === "MANAGER"
                        ? "Gestor do grupo"
                        : "Somente visualização"}
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
      </div>
    </div>
  );
}
