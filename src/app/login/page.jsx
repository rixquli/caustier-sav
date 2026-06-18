"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import Image from "next/image";

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
      const result = await signIn.email({
        email: mailValue.trim(),
        password,
      });

      if (result.error) {
        setError(result.error.message || "Identifiants incorrects.");
        return;
      }

      const meRes = await fetch("/api/me");
      const meData = meRes.ok ? await meRes.json() : null;

      if (meData?.user?.mustChangePassword) {
        router.push("/compte/changer-mot-de-passe");
      } else {
        router.push("/");
      }
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
            <Image src={"/favicon.ico"} alt="logo" width={100} height={100} />
            <p>Connectez-vous à votre compte.</p>
          </div>

          <form className="log-content" onSubmit={doLogin}>
            {error && (
              <div className="err show" role="alert">
                {error}
              </div>
            )}

            <div className="field">
              <label htmlFor="log-email">Email</label>
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

            <button type="submit" className="btn btn-auth" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
