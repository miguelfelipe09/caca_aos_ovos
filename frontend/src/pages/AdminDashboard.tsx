import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { adjustScoreForTesting, resetProgressForTesting } from "../services/captureService";
import { ARPoint, deletePoint, listPoints } from "../services/pointsService";

export default function AdminDashboard() {
  const [points, setPoints] = useState<ARPoint[]>([]);
  const [testingMessage, setTestingMessage] = useState<string | null>(null);
  const [testingError, setTestingError] = useState<string | null>(null);
  const [testingBusy, setTestingBusy] = useState(false);
  const { user, updateScore } = useAuthStore();

  const load = () => {
    listPoints().then(setPoints).catch(console.error);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir ponto AR?")) return;
    await deletePoint(id);
    load();
  };

  const clearVictoryModalSession = () => {
    if (!user) return;
    window.sessionStorage.removeItem(`victory-modal-seen:${user.id}`);
  };

  const handleAdjustScore = async (delta: number) => {
    setTestingBusy(true);
    setTestingError(null);
    setTestingMessage(null);

    try {
      const updatedUser = await adjustScoreForTesting(delta);
      updateScore(updatedUser.totalScore);
      if (updatedUser.totalScore < 4) {
        clearVictoryModalSession();
      }
      setTestingMessage(`Pontuação atualizada para ${updatedUser.totalScore} pts.`);
    } catch (error: any) {
      setTestingError(error?.response?.data?.message || "Não foi possível ajustar a pontuação.");
    } finally {
      setTestingBusy(false);
    }
  };

  const handleResetProgress = async () => {
    if (!confirm("Resetar capturas e pontuação para testar novamente?")) return;

    setTestingBusy(true);
    setTestingError(null);
    setTestingMessage(null);

    try {
      const updatedUser = await resetProgressForTesting();
      updateScore(updatedUser?.totalScore ?? 0);
      clearVictoryModalSession();
      setTestingMessage("Progresso resetado. Agora você pode capturar todos os pokejoys novamente.");
      load();
    } catch (error: any) {
      setTestingError(error?.response?.data?.message || "Não foi possível resetar o progresso.");
    } finally {
      setTestingBusy(false);
    }
  };

  return (
    <div className="mt-8 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent">Dashboard Admin</h1>
        <div className="flex gap-2">
          <Link to="/admin/users" className="rounded bg-slate-700 px-4 py-2 text-white">
            Usuários
          </Link>
          <Link to="/admin/points/new" className="rounded bg-primary px-4 py-2 text-white">
            Novo ponto
          </Link>
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Teste de progresso</p>
            <h2 className="mt-2 text-xl font-bold text-white">Pontuação do admin logado</h2>
            <p className="mt-1 text-sm text-slate-400">
              Use os botões abaixo para simular vitória e resetar as capturas para um novo teste.
            </p>
          </div>
          <div className="rounded-2xl border border-accent/20 bg-slate-900/50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Score atual</p>
            <p className="text-3xl font-black text-accent">{user?.totalScore ?? 0} pts</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={testingBusy}
            onClick={() => handleAdjustScore(1)}
            className="rounded-2xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            +1 ponto
          </button>
          <button
            type="button"
            disabled={testingBusy}
            onClick={() => handleAdjustScore(-1)}
            className="rounded-2xl bg-amber-400 px-4 py-2 font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            -1 ponto
          </button>
          <button
            type="button"
            disabled={testingBusy}
            onClick={handleResetProgress}
            className="rounded-2xl bg-rose-500 px-4 py-2 font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Resetar capturas
          </button>
        </div>

        {testingMessage && <p className="mt-4 text-sm text-emerald-300">{testingMessage}</p>}
        {testingError && <p className="mt-4 text-sm text-red-300">{testingError}</p>}
      </div>

      <div className="glass space-y-3 rounded-3xl p-4">
        {points.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded bg-slate-800/60 px-4 py-3">
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-slate-400">{p.slug}</p>
              <p className="text-xs text-slate-400">Modelo: {p.modelUrl}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-accent">{p.points} pts</span>
              <span className={p.isActive ? "text-success" : "text-red-400"}>
                {p.isActive ? "Ativo" : "Inativo"}
              </span>
              <Link to={`/admin/points/${p.id}`} className="rounded bg-slate-700 px-3 py-1">
                Editar
              </Link>
              <button onClick={() => handleDelete(p.id)} className="rounded bg-red-600 px-3 py-1">
                Excluir
              </button>
            </div>
          </div>
        ))}
        {points.length === 0 && <p>Nenhum ponto cadastrado.</p>}
      </div>
    </div>
  );
}
