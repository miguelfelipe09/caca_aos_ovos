import { api } from "./api";

export interface ARPoint {
  id: string;
  name: string;
  slug: string;
  description?: string;
  targetIndex?: number;
  targetName?: string;
  modelUrl: string;
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  points: number;
  isActive: boolean;
  captured?: boolean;
}

export const listPoints = async () => {
  const res = await api.get<ARPoint[]>("/ar-points");
  return res.data;
};

export const getPoint = async (id: string) => {
  const res = await api.get<ARPoint>(`/ar-points/${id}`);
  return res.data;
};

export const createPoint = async (data: Partial<ARPoint>) => {
  const res = await api.post<ARPoint>("/ar-points", data);
  return res.data;
};

export const updatePoint = async (id: string, data: Partial<ARPoint>) => {
  const res = await api.put<ARPoint>(`/ar-points/${id}`, data);
  return res.data;
};

export const deletePoint = async (id: string) => {
  await api.delete(`/ar-points/${id}`);
};
