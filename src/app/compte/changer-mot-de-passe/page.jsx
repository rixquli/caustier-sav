"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/context/AuthContext";

export default function ChangerMotDePassePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors du changement.");
        return;
      }

      await refreshUser();
      router.push("/");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout
      title="Changer votre mot de passe"
      description={
        user?.mustChangePassword
          ? "Vous devez définir un nouveau mot de passe pour continuer."
          : "Mettez à jour votre mot de passe."
      }
    >
      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-field">
          <label htmlFor="password">Nouveau mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className="form-field">
          <label htmlFor="confirm">Confirmer le mot de passe</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </PageLayout>
  );
}
