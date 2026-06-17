"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";

export default function AdminFaqNewPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [reponse, setReponse] = useState("");
  const [categorie, setCategorie] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, reponse, categorie }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(`/admin/faq/${data.entry.id}`);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout title="Nouvelle entrée FAQ" description="Ajoutez une question/réponse à la base de connaissances.">
      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-field">
          <label>Question</label>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Réponse</label>
          <textarea value={reponse} onChange={(e) => setReponse(e.target.value)} rows={6} required />
        </div>
        <div className="form-field">
          <label>Catégorie</label>
          <input value={categorie} onChange={(e) => setCategorie(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Création…" : "Créer"}
        </button>
      </form>
    </PageLayout>
  );
}
