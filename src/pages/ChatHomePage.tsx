/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo, useState } from "react";
import type { SearchUserResponse } from "../api/users";
import { NewConversationModal } from "../components/NewConversationModal";

import { decryptMessageAesGcm, encryptMessage, encryptMessageAesGcm } from "../crypto/messageCrypto";
import { wsClient } from "../ws/wsClient";

import { getRoomKey } from "../state/roomKeys";
import { createOrGetPrivateConversation, getPublicEcdhForUser } from "../api/chat";
import { getCryptoSession } from "../state/cryptoSession";
import { createRoomKeysForUsers } from "../crypto/roomKeysCrypto";
import { importAesKeyFromRaw } from "../crypto/webcrypto";
import { useChat } from "../hooks/useChat";

type Message = {
  id: string;
  fromMe: boolean;
  text: string;
};

const DEMO_MESSAGES: Record<string, Message[]> = {
  "u-a": [
    { id: "m1", fromMe: false, text: "Hi, how are you doing?" },
    { id: "m2", fromMe: true, text: "Hello there!" },
    { id: "m3", fromMe: true, text: "Everything is going well." },
    { id: "m4", fromMe: true, text: "How about you?" },
  ],
  "u-b": [{ id: "m1", fromMe: false, text: "Hello!" }],
  "g-x": [{ id: "m1", fromMe: false, text: "Welcome to the group" }],
};

export function ChatHomePage({
  appName,
  usernameInitial,
  onLogout,
}: {
  appName: string;
  usernameInitial: string;
  onLogout: () => void;
}) {
  const {conversations, selectedId, setSelectedId, startPrivateConversation} = useChat();
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [draft, setDraft] = useState("");

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.name.toLowerCase().includes(q));
  }, [query, conversations]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const messages = selected ? (DEMO_MESSAGES[selected.id] ?? []) : [];

  function selectConversation(id: number) {
    setSelectedId(id);
  }

  function sendMessage() {
  if (!selected || !draft.trim()) return;

  const roomId = selected.id;
  const clientMessageId = crypto.randomUUID();

  const roomKey = getRoomKey(roomId);

  if (!roomKey) {
    console.error("No room key for room", roomId);
    return;
  }

  const encrypted = encryptMessage({
    plaintext: draft,
    key: roomKey.key,
  });

  const payload = {
    clientMessageId,
    keyVersion: roomKey.version,
    ciphertextB64: encrypted.ciphertextB64,
    ivB64: encrypted.ivB64,
    aadB64: encrypted.aadB64,
  };

  wsClient.publish({
    destination: `/app/rooms/${roomId}/send`,
    body: JSON.stringify(payload),
  });

  setDraft("");
}
  async function startConversationWithUser(u: SearchUserResponse) {
    console.log(u);
    const res = await createOrGetPrivateConversation({otherUserId: u.id});

    const publicEcdhJwk = await getPublicEcdhForUser(u.id);
    console.log(publicEcdhJwk);
    
    console.log(res);


    // Creating room Keys

    const groupMembers = res.roomMembersDataList.map((rm) => ({userId: rm.userId, publicEcdhJwk: rm.publicEcdhJwk}));

    console.log(groupMembers);

    const cryptoSessionData = getCryptoSession();

    const senderContext = {
      userId: cryptoSessionData.myUserId,
      mkAesKey: cryptoSessionData.myMasterKey,
      ecdhPrivateKey: cryptoSessionData.myEcdhPrivateKey
    };


    const roomKeyCreationResponse = await createRoomKeysForUsers({roomId: res.roomId, sender: senderContext, members: groupMembers, version: res.currentKeyVersion});

    console.log(roomKeyCreationResponse);

    const roomKeyCryptoKey = await importAesKeyFromRaw(roomKeyCreationResponse.roomKeyRaw);
    
    console.log(roomKeyCryptoKey);

    console.log("//////TEST//////");

    const encryptedMessage = await encryptMessageAesGcm(roomKeyCryptoKey, "Hello message", {aad: "xd"});

    console.log("Encrypted message:");
    console.log(encryptedMessage);

    const decryptedMessage = await decryptMessageAesGcm(roomKeyCryptoKey, encryptedMessage);

    console.log("Decrypted message");
    console.log(decryptedMessage);


    //END OF TEST////

    setSelectedId(res.roomId);
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
            onClick={() => alert("(DEMO) nowa grupa")}
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
                  onClick={() => selectConversation(c.id)}
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

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => setSelectedId(null)}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="chat-body">
                {messages.map((m) => (
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
                    if (e.key === "Enter") sendMessage();
                  }}
                />
                <button
                  className="send"
                  type="button"
                  disabled={!draft.trim()}
                  onClick={sendMessage}
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
        onPickUser={startPrivateConversation}
      />
    </div>
  );
}
