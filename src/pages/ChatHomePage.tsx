// pages/ChatHomePage.tsx

import { useMemo, useState } from "react";
import { NewConversationModal } from "../components/NewConversationModal";
import type { SearchUserResponse } from "../api/users";
import { useWebSocket } from "../hooks/useWebSocket";
import { useChat } from "../hooks/useChat";
import { useMessages } from "../hooks/useMessages";

type ChatHomePageProps = {
  appName: string;
  token: string;
  myUserId: number;
  usernameInitial: string;
  onLogout: () => void;
};

export function ChatHomePage({
  appName,
  myUserId,
  usernameInitial,
  onLogout,
}: ChatHomePageProps) {
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");

  // 1. Uruchamia STOMP connection
  const token = localStorage.getItem("accessToken");
  const { connected } = useWebSocket(token);

  // 2. Zarządza listą rozmów
  const {
    conversations,
    selected,
    selectedId,
    setSelectedId,
    startPrivateConversation,
  } = useChat();

  // 3. Zarządza wiadomościami dla aktywnego roomu
  const {
    messages,
    loading,
    sendMessage,
  } = useMessages(selectedId, myUserId, connected);

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((c) =>
      c.name.toLowerCase().includes(q)
    );
  }, [query, conversations]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || !selectedId) return;

    await sendMessage(text);
    setDraft("");
  }

  async function handlePickUser(user: SearchUserResponse) {
    await startPrivateConversation(user);
    setNewConvOpen(false);
  }

  return (
    <div className="chat-page">
      <div className="topbar">
        <div className="topbar-left">
          <div className="app-badge">
            <div className="app-dot" />
            <div className="app-name">{appName}</div>
          </div>

          <div style={{ marginLeft: 12, fontSize: 12 }}>
            WS: {connected ? "connected" : "disconnected"}
          </div>
        </div>

        <div className="topbar-right">
          <div className="avatar">{usernameInitial}</div>
          <button className="btn btn-ghost" type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="search-row">
        <div className="search-wrap">
          <input
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for user or group"
          />

          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => setNewConvOpen(true)}
          >
            New conversation
          </button>

          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => alert("TODO: create group")}
          >
            New group
          </button>
        </div>
      </div>

      <div className="main">
        <div className={`shell ${selected ? "with-chat" : "no-chat"}`}>
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="sidebar-title">
                {selected ? "Chats" : "Last chats"}
              </div>
              <div className="pill">{conversations.length}</div>
            </div>

            <div className="list">
              {filteredConversations.map((c) => (
                <button
                  key={c.id}
                  className={`conv ${selectedId === c.id ? "active" : ""}`}
                  onClick={() => setSelectedId(c.id)}
                  type="button"
                >
                  <div className="conv-avatar">
                    {c.name.slice(0, 1).toUpperCase()}
                  </div>

                  <div>
                    <div className="conv-name">{c.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {selected && (
            <section className="chat">
              <div className="chat-header">
                <div>
                  <div className="chat-title">{selected.name}</div>
                  <div className="chat-sub">
                    {selected.type === "group"
                      ? "Group chat"
                      : "Private messages"}
                  </div>
                </div>

                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setSelectedId(null)}
                >
                  Close
                </button>
              </div>

              <div className="chat-body">
                {loading && <div className="chat-sub">Loading messages…</div>}

                {!loading &&
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`bubble ${m.fromMe ? "me" : "them"}`}
                    >
                      {m.text}
                    </div>
                  ))}
              </div>

              <div className="chat-input">
                <input
                  className="input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type message…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSend();
                    }
                  }}
                />

                <button
                  className="send"
                  type="button"
                  disabled={!draft.trim() || !connected}
                  onClick={handleSend}
                >
                  Send
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      <NewConversationModal
        open={newConvOpen}
        onClose={() => setNewConvOpen(false)}
        onPickUser={handlePickUser}
      />
    </div>
  );
}