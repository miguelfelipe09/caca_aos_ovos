import { api } from "./api";
import { User } from "../store/authStore";

export const register = async (data: { name: string; email: string; password: string }) => {
  const res = await api.post<{ token: string; user: User }>("/auth/register", data);
  return res.data;
};

export const login = async (data: { email: string; password: string }) => {
  const res = await api.post<{ token: string; user: User }>("/auth/login", data);
  return res.data;
};

export const me = async () => {
  const res = await api.get<{ user: User }>("/auth/me");
  return res.data.user;
};
