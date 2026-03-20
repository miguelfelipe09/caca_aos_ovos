import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ARPoint, listPoints, deletePoint } from "../services/pointsService";

export default function AdminDashboard() {
  const [points, setPoints] = useState<ARPoint[]>([]);

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

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-accent">Dashboard Admin</h1>
        <Link to="/admin/points/new" className="bg-primary px-4 py-2 rounded text-white">
          Novo ponto
        </Link>
      </div>
      <div className="glass p-4 rounded-3xl space-y-3">
        {points.map((p) => (
          <div key={p.id} className="bg-slate-800/60 px-4 py-3 rounded flex justify-between items-center">
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
              <Link to={`/admin/points/${p.id}`} className="px-3 py-1 rounded bg-slate-700">
                Editar
              </Link>
              <button onClick={() => handleDelete(p.id)} className="px-3 py-1 rounded bg-red-600">
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
