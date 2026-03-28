import { api } from "./api";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "ADMIN" | "USER";
  totalScore: number;
  createdAt: string;
  capturesCount: number;
}

interface ListResponse {
  users: Array<
    Omit<AppUser, "capturesCount"> & {
      _count: { captures: number };
    }
  >;
}

export const listUsers = async (): Promise<AppUser[]> => {
  const res = await api.get<ListResponse>("/users");
  return res.data.users.map((u) => ({
    ...u,
    capturesCount: u._count.captures,
  }));
};

export const deleteUser = async (id: string) => {
  await api.delete(`/users/${id}`);
};
