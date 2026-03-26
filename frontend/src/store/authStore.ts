import { create } from "zustand";
import { persist } from "zustand/middleware";

type Role = "ADMIN" | "USER";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  totalScore: number;
}

interface AuthState {
  user?: User;
  token?: string;
  setAuth: (data: { user: User; token: string }) => void;
  logout: () => void;
  updateScore: (score: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: undefined,
      token: undefined,
      setAuth: ({ user, token }) => set({ user, token }),
      logout: () => set({ user: undefined, token: undefined }),
      updateScore: (score) =>
        set((state) => (state.user ? { user: { ...state.user, totalScore: score } } : state)),
    }),
    { name: "caca-auth" }
  )
);
