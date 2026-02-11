import { useEffect, useState } from "react";
import { useUserSearch } from "../hooks/useUserSearch";
import type { SearchUserResponse } from "../api/users";

export function NewConversationModal({
  open,
  onClose,
  onPickUser,
}: {
  open: boolean;
  onClose: () => void;
  onPickUser: (u: SearchUserResponse) => void;
}) {
  const [q, setQuery] = useState("");

  function handleClose() {
    setQuery("");
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const { items, loading, error } = useUserSearch(open, q);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={handleClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">New conversation</div>
            <div className="hint">Enter at least 2 characters to search for a user.</div>
          </div>
          <button className="icon-btn" type="button" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <input
            className="input"
            autoFocus
            value={q}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a user…"
          />

          {loading && <div className="hint">Searching…</div>}
          {error && <div style={{ color: "crimson" }}>{error}</div>}

          <div className="suggest-list">
            {!loading && !error && q.trim().length >= 2 && items.length === 0 && (
              <div className="hint">No results</div>
            )}

            {items.map((u) => (
              <button
                key={u.id}
                className="suggest-item"
                type="button"
                onClick={() => {
                  onPickUser(u);
                  handleClose();
                }}
              >
                <div className="conv-avatar">{u.username.slice(0, 1).toUpperCase()}</div>
                <div>
                  <div className="suggest-name">{u.username}</div>
                  <div className="suggest-sub">ID: {u.id}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
