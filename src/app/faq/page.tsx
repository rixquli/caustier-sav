"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import type { FaqRow } from "@/lib/ai-assistant";

type FaqListResponse = {
  faq: FaqRow[];
  categories: string[];
};

export default function FaqPage() {
  const [faq, setFaq] = useState<FaqRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categorie) params.set("categorie", categorie);

    fetch(`/api/faq?${params}`)
      .then((res) => (res.ok ? res.json() : { faq: [], categories: [] }))
      .then((data: FaqListResponse) => {
        setFaq(data.faq ?? []);
        setCategories(data.categories ?? []);
      })
      .finally(() => setLoading(false));
  }, [search, categorie]);

  return (
    <PageLayout title="Questions fréquentes" description="Consultez les réponses aux problèmes courants.">
      <div className="filters-row">
        <div className="form-field search-field">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
          />
        </div>
        <div className="form-field">
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            <option value="">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="page-muted">Chargement…</p>
      ) : faq.length === 0 ? (
        <div className="page-card"><p>Aucune question trouvée.</p></div>
      ) : (
        <ul className="faq-list">
          {faq.map((entry) => (
            <li key={entry.id} className="faq-item">
              {entry.categorie && <span className="badge badge--info">{entry.categorie}</span>}
              <h3>{entry.question}</h3>
              <p>{entry.reponse}</p>
            </li>
          ))}
        </ul>
      )}
    </PageLayout>
  );
}
