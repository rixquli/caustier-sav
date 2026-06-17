"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";

export default function AdminFaqDetailPage({ params }) {
  const router = useRouter();
  const [id, setId] = useState(null);
  const [question, setQuestion] = useState("");
  const [reponse, setReponse] = useState("");
  const [categorie, setCategorie] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);

  async function load() {
    if (!id) return;
    const res = await fetch(`/api/faq/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setQuestion(data.entry.question);
    setReponse(data.entry.reponse);
    setCategorie(data.entry.categorie ?? "");
    setHistory(data.history ?? []);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/faq/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, reponse, categorie }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setMessage("Entrée mise à jour.");
      await load();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette entrée ?")) return;
    const res = await fetch(`/api/faq/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/faq");
  }

  if (loading) return <PageLayout title="FAQ"><p className="page-muted">Chargement…</p></PageLayout>;

  return (
    <PageLayout title="Édition FAQ" description={`Entrée #${id}`}>
      <form className="form-card" onSubmit={handleSave}>
        {message && <div className="alert alert-success">{message}</div>}
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
          <input value={categorie} onChange={(e) => setCategorie(e.target.value)} placeholder="Ex. Panne, Maintenance…" />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            Supprimer
          </button>
        </div>
      </form>

      <section className="page-section">
        <h2>Historique des modifications</h2>
        {history.length === 0 ? (
          <p className="page-muted">Aucun historique.</p>
        ) : (
          <ul className="activity-list">
            {history.map((h) => (
              <li key={h.id} className="activity-item">
                <div>
                  <strong>{h.question}</strong>
                  <p className="page-muted">{h.reponse.slice(0, 120)}{h.reponse.length > 120 ? "…" : ""}</p>
                </div>
                <span className="page-muted">
                  {[h.user_prenom, h.user_nom].filter(Boolean).join(" ") || h.user_name || "Système"} —{" "}
                  {new Date(h.created_at).toLocaleString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageLayout>
  );
}
