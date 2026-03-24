import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Home() {
  const { user } = useAuthStore();

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      <div className="glass rounded-3xl p-6">
        <h1 className="text-3xl font-bold text-primary">Bem-vindo, {user?.name}!</h1>
        <p className="mt-2 text-slate-600">
          {"Prepare-se para a Ca\u00e7a aos Ovos em realidade aumentada. Procure os alvos e capture personagens para ganhar pontos."}
        </p>
        <div className="mt-4 flex gap-3">
          <Link to="/ar" className="rounded bg-primary px-4 py-2 text-white shadow-sm hover:bg-primary/90">
            {"Iniciar Ca\u00e7a AR"}
          </Link>
          <Link to="/ranking" className="rounded border border-primary px-4 py-2 text-primary hover:bg-primary/10">
            Ver Ranking
          </Link>
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="mb-2 text-xl font-semibold text-slate-800">{"Sua pontua\u00e7\u00e3o"}</h2>
        <p className="text-5xl font-black text-primary">{user?.totalScore ?? 0}</p>
        <p className="mt-2 text-slate-600">Capture cada ponto AR apenas uma vez.</p>
      </div>
    </div>
  );
}
