import { useEffect, useRef, useState } from "react";
import { searchUsers, type SearchUserResponse } from "../api/users";

export function useUserSearch(open: boolean, q: string) {
  const [items, setItems] = useState<SearchUserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setItems([]);
      setLoading(false);
      setError(null);
      abortRef.current?.abort();
      return;
    }

    const query = q.trim();
    if (query.length < 2) {
      setItems([]);
      setLoading(false);
      setError(null);
      abortRef.current?.abort();
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setLoading(true);
      setError(null);

      try {
        const data = await searchUsers(query, ac.signal);
        setItems(data);
      } catch (e: unknown) {
        if (isAbortError(e)) return;
        setError(getErrorMessage(e));
        setItems([]);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [open, q]);

  return { items, loading, error };
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Search failed";
}

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}
