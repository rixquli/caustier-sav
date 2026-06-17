"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";

export default function NewUserPage() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdPassword, setCreatedPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, password, phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la création.");
        return;
      }

      setCreatedPassword(password);
      setNom("");
      setEmail("");
      setPassword("");
      setPhone("");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout
      title="Ajouter un client"
      description="Créez un compte client et communiquez-lui le mot de passe."
    >
      {createdPassword && (
        <div className="alert alert-success">
          Client créé. Mot de passe à transmettre : <strong>{createdPassword}</strong>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: "1rem" }}
            onClick={() => router.push("/users")}
          >
            Voir la liste
          </button>
        </div>
      )}

      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-field">
          <label htmlFor="nom">Nom</label>
          <input
            id="nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe à transmettre au client"
            required
            minLength={6}
          />
        </div>

        <div className="form-field">
          <label htmlFor="phone">Téléphone (optionnel)</label>
          <input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Création…" : "Créer le client"}
        </button>
      </form>
    </PageLayout>
  );
}
