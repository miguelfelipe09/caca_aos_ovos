import { useEffect, useState } from "react";
import { ranking } from "../services/captureService";

export default function RankingPage() {
  const [data, setData] = useState<{ id: string; name: string; totalScore: number }[]>([]);

  useEffect(() => {
    ranking().then(setData).catch(console.error);
  }, []);

  return (
    <div className="mt-8 glass p-6 rounded-3xl">
      <h1 className="text-2xl font-bold text-accent mb-4">Ranking</h1>
      <div className="space-y-2">
        {data.map((user, i) => (
          <div key={user.id} className="flex justify-between bg-slate-800/50 px-4 py-2 rounded">
            <span className="text-slate-300">#{i + 1} {user.name}</span>
            <span className="text-accent font-semibold">{user.totalScore} pts</span>
          </div>
        ))}
        {data.length === 0 && <p>Nenhum participante ainda.</p>}
      </div>
    </div>
  );
}
