"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [mailValue, setMailValue] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function doLogin(e) {
    e.preventDefault();
    setError("");

    if (!mailValue.trim() || !password) {
      setError("Remplissez tous les champs.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mailValue.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Identifiants incorrects.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="log-container" id="login-page">
      <div className="log-page">
        <div className="log-card">
          <div className="log-header">
            <div className="log-logo">C</div>
            <h1>Caustier</h1>
            <p>Connectez-vous à votre compte.</p>
          </div>

          <form className="log-content" onSubmit={doLogin}>
            {error && (
              <div className="err show" role="alert">
                {error}
              </div>
            )}

            <div className="field">
              <label htmlFor="log-email">Identifiant / Email</label>
              <input
                type="email"
                id="log-email"
                placeholder="vous@example.fr"
                value={mailValue}
                autoComplete="email"
                disabled={loading}
                onChange={(e) => setMailValue(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="log-password">Mot de passe</label>
              <input
                type="password"
                id="log-password"
                placeholder="••••••"
                value={password}
                autoComplete="current-password"
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-auth"
              disabled={loading}
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
