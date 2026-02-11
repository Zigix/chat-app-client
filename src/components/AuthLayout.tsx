import React from "react";

export function AuthLayout({
  appName,
  children,
}: {
  appName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-page">
      <header className="auth-header">
        <div className="brand">
          <div className="brand-dot" />
          <div className="brand-name">{appName}</div>
        </div>
      </header>

      <main className="auth-main">{children}</main>
    </div>
  );
}