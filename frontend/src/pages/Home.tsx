import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Home() {
  const { user } = useAuthStore();
  return (
    <div className="mt-10 grid md:grid-cols-2 gap-6">
      <div className="glass p-6 rounded-3xl">
        <h1 className="text-3xl font-bold text-primary">Bem-vindo, {user?.name}!</h1>
        <p className="text-slate-600 mt-2">
          Prepare-se para a Caça aos Ovos em realidade aumentada. Procure os alvos e capture
          personagens para ganhar pontos.
        </p>
        <div className="flex gap-3 mt-4">
          <Link to="/ar" className="bg-primary px-4 py-2 rounded text-white shadow-sm hover:bg-primary/90">
            Iniciar Caça AR
          </Link>
          <Link to="/ranking" className="border border-primary text-primary px-4 py-2 rounded hover:bg-primary/10">
            Ver Ranking
          </Link>
        </div>
      </div>
      <div className="glass p-6 rounded-3xl">
        <h2 className="text-xl font-semibold mb-2 text-slate-800">Sua pontuação</h2>
        <p className="text-5xl font-black text-primary">{user?.totalScore ?? 0}</p>
        <p className="mt-2 text-slate-600">Capture cada ponto AR apenas uma vez.</p>
      </div>
    </div>
  );
}
