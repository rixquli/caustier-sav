"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";

function FaqEditor({ entry, onSave, onCancel }) {
  const [question, setQuestion] = useState(entry?.question ?? "");
  const [reponse, setReponse] = useState(entry?.reponse ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSave({ question, reponse });
    } catch (err) {
      setError(err.message || "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-field">
        <label htmlFor="question">Question</label>
        <input
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="reponse">Réponse</label>
        <textarea
          id="reponse"
          value={reponse}
          onChange={(e) => setReponse(e.target.value)}
          rows={4}
          required
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

export default function AdminFaqPage() {
  const [faq, setFaq] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);

  async function loadFaq() {
    const res = await fetch("/api/faq");
    const data = res.ok ? await res.json() : { faq: [] };
    setFaq(data.faq ?? []);
  }

  useEffect(() => {
    loadFaq().finally(() => setLoading(false));
  }, []);

  async function handleCreate({ question, reponse }) {
    const res = await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, reponse }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setCreating(false);
    await loadFaq();
  }

  async function handleUpdate(id, { question, reponse }) {
    const res = await fetch(`/api/faq/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, reponse }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setEditingId(null);
    await loadFaq();
  }

  async function handleDelete(id) {
    if (!confirm("Supprimer cette entrée ?")) return;
    await fetch(`/api/faq/${id}`, { method: "DELETE" });
    await loadFaq();
  }

  return (
    <PageLayout
      title="Gestion FAQ"
      description="Créez et modifiez les questions fréquentes."
    >
      {!creating && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
        >
          Ajouter une question
        </button>
      )}

      {creating && (
        <div className="page-section">
          <h2>Nouvelle question</h2>
          <FaqEditor onSave={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {loading ? (
        <p className="page-muted">Chargement…</p>
      ) : faq.length === 0 ? (
        <div className="page-card">
          <p>Aucune entrée FAQ.</p>
        </div>
      ) : (
        <ul className="faq-admin-list">
          {faq.map((entry) => (
            <li key={entry.id} className="faq-admin-item">
              {editingId === entry.id ? (
                <FaqEditor
                  entry={entry}
                  onSave={(data) => handleUpdate(entry.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <h3>{entry.question}</h3>
                  <p>{entry.reponse}</p>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditingId(entry.id);
                        setCreating(false);
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </PageLayout>
  );
}
