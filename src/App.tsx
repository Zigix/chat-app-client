import { useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ChatHomePage } from "./pages/ChatHomePage";

type View = "login" | "register" | "chat";

export default function App() {
  const [view, setView] = useState<View>("login");

  const [username, setUsername] = useState<string>("");

  function logout() {
    setUsername("");
    setView("login");
  }

  if (view === "register") {
    return <RegisterPage onGoLogin={() => setView("login")} />;
  }

  if (view === "chat") {
    return (
      <ChatHomePage
        appName="ChatApp"
        usernameInitial={(username?.[0] ?? "U").toUpperCase()}
        onLogout={logout}
      />
    );
  }

  return (
    <LoginPage
      onGoRegister={() => setView("register")}
      onLoggedIn={(u: string) => {
        setUsername(u);
        setView("chat");
      }}
    />
  );
}
