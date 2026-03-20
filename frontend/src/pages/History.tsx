import { useEffect, useState } from "react";
import { myCaptures } from "../services/captureService";

export default function HistoryPage() {
  const [data, setData] = useState<
    { id: string; earnedPoints: number; capturedAt: string; arPoint: { name: string; slug: string } }[]
  >([]);

  useEffect(() => {
    myCaptures().then(setData).catch(console.error);
  }, []);

  return (
    <div className="mt-8 glass p-6 rounded-3xl">
      <h1 className="text-2xl font-bold text-accent mb-4">Histórico de Capturas</h1>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.id} className="flex justify-between bg-slate-800/50 px-4 py-2 rounded">
            <div>
              <p className="font-semibold">{item.arPoint.name}</p>
              <p className="text-xs text-slate-400">
                {new Date(item.capturedAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <span className="text-success font-semibold">+{item.earnedPoints} pts</span>
          </div>
        ))}
        {data.length === 0 && <p>Ainda sem capturas.</p>}
      </div>
    </div>
  );
}
