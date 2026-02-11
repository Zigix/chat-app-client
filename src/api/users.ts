import { apiFetch } from "./client";

export type SearchUserResponse = {
  id: number;
  username: string;
};

export async function searchUsers(q: string, signal?: AbortSignal): Promise<SearchUserResponse[]> {
  const qs = new URLSearchParams({ q }).toString();

  return apiFetch<SearchUserResponse[]>(`/users/search?${qs}`, {
    method: "GET",
    signal,
  });
}
