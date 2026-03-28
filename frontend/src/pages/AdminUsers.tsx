import { useEffect, useState } from "react";
import { deleteUser, listUsers, AppUser } from "../services/userService";

export default function AdminUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    const user = users.find((u) => u.id === id);
    const name = user?.name || "este usuário";
    if (!confirm(`Excluir ${name}? Esta ação não poderá ser desfeita.`)) return;

    setBusyId(id);
    setError(null);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Não foi possível excluir o usuário.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-8 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Admin</p>
          <h1 className="text-2xl font-bold text-accent">Usuários cadastrados</h1>
          <p className="text-sm text-slate-400">
            Lista para captação de leads: visualize dados, pontuação e apague usuários inativos.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Recarregar
        </button>
      </div>

      <div className="glass rounded-3xl p-5">
        {error && <p className="mb-4 rounded-xl bg-rose-500/20 px-4 py-2 text-rose-100">{error}</p>}
        {loading ? (
          <p>Carregando usuários...</p>
        ) : users.length === 0 ? (
          <p>Nenhum usuário cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 pr-3">Nome</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Telefone</th>
                  <th className="py-2 pr-3">Pontuação</th>
                  <th className="py-2 pr-3">Capturas</th>
                  <th className="py-2 pr-3">Criado em</th>
                  <th className="py-2 pr-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40">
                    <td className="py-3 pr-3 font-semibold text-white">{u.name}</td>
                    <td className="py-3 pr-3">{u.email}</td>
                    <td className="py-3 pr-3">{u.phone || "—"}</td>
                    <td className="py-3 pr-3 text-accent font-semibold">{u.totalScore} pts</td>
                    <td className="py-3 pr-3">{u.capturesCount}</td>
                    <td className="py-3 pr-3 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={busyId === u.id}
                        className="rounded bg-red-600 px-3 py-1 text-white text-xs font-semibold hover:bg-red-500 disabled:opacity-60"
                      >
                        {busyId === u.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
