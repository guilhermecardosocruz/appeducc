"use client";

import { useState } from "react";

type Props = {
  initialName: string;
  initialEmail: string;
  initialCpf: string;
};

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export default function AccountProfileClient({
  initialName,
  initialEmail,
  initialCpf,
}: Props) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [cpf, setCpf] = useState(formatCpf(initialCpf));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          cpf,
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        passwordChanged?: boolean;
      };

      if (!res.ok) {
        setErrorMessage(data.error ?? "Erro ao atualizar seus dados.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setSuccessMessage(
        data.passwordChanged
          ? "Dados atualizados e senha alterada com sucesso."
          : "Dados atualizados com sucesso."
      );

      window.location.reload();
    } catch (error) {
      console.error("Erro ao atualizar perfil", error);
      setErrorMessage("Erro ao atualizar seus dados.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Minha conta</h1>
      <p className="mt-2 text-sm text-slate-500">
        Atualize seus dados cadastrais e, se quiser, troque sua senha.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Nome completo
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">CPF</label>
            <input
              type="text"
              inputMode="numeric"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Trocar senha</h2>
          <p className="mt-1 text-xs text-slate-500">
            Preencha os campos abaixo apenas se quiser alterar sua senha.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Senha antiga
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Senha nova
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Repita a senha nova
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}

        {successMessage && (
          <p className="text-sm text-emerald-600">{successMessage}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
