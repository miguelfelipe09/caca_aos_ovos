import { api } from "./api";

export interface CaptureResponse {
  success?: boolean;
  alreadyCaptured?: boolean;
  earnedPoints: number;
  totalScore: number;
  captureName: string;
}

export const capturePoint = async (arPointId: string) => {
  const res = await api.post<CaptureResponse>("/captures", { arPointId });
  return res.data;
};

export const myCaptures = async () => {
  const res = await api.get("/captures/me");
  return res.data as {
    id: string;
    earnedPoints: number;
    totalScoreAfter: number;
    capturedAt: string;
    arPoint: { name: string; points: number; slug: string };
  }[];
};

export const ranking = async () => {
  const res = await api.get("/captures/ranking");
  return res.data as { id: string; name: string; totalScore: number }[];
};
