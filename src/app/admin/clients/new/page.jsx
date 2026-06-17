"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";

export default function NewClientPage() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, prenom, email, phone, adresse }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la création.");
        return;
      }

      setTempPassword(data.tempPassword);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout title="Nouveau client" description="Créez un compte client avec mot de passe temporaire.">
      {tempPassword && (
        <div className="alert alert-success">
          Client créé. Mot de passe temporaire à transmettre : <strong>{tempPassword}</strong>
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginLeft: "1rem" }} onClick={() => router.push("/admin/clients")}>
            Voir la liste
          </button>
        </div>
      )}

      {!tempPassword && (
        <form className="form-card" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="prenom">Prénom</label>
              <input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="nom">Nom</label>
              <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-field">
            <label htmlFor="phone">Téléphone</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="form-field">
            <label htmlFor="adresse">Adresse</label>
            <textarea id="adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} rows={2} />
          </div>

          <p className="page-muted">Un mot de passe temporaire sera généré automatiquement.</p>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Création…" : "Créer le client"}
          </button>
        </form>
      )}
    </PageLayout>
  );
}
