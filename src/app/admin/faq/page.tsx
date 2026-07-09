"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import type { FaqRow } from "@/lib/ai-assistant";

type FaqListResponse = {
  faq: FaqRow[];
  categories: string[];
};

export default function AdminFaqPage() {
  const [faq, setFaq] = useState<FaqRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
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

  const sorted = useMemo(() => {
    return [...faq].sort((a, b) => {
      const da = new Date(a.updated_at).getTime();
      const db = new Date(b.updated_at).getTime();
      return sortDesc ? db - da : da - db;
    });
  }, [faq, sortDesc]);

  return (
    <PageLayout title="Gestion FAQ" description="Base de connaissances et questions fréquentes.">
      <div className="admin-demandes-header">
        <div className="filters-row">
          <div className="form-field search-field">
            <input type="search" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
        <Link href="/admin/faq/new" className="btn btn-primary">Nouvelle entrée</Link>
      </div>

      {loading ? (
        <p className="page-muted">Chargement…</p>
      ) : sorted.length === 0 ? (
        <div className="empty-state"><p>Aucune entrée FAQ.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Catégorie</th>
                <th>
                  <button type="button" className="table-sort-btn" onClick={() => setSortDesc((v) => !v)}>
                    Modifiée le {sortDesc ? "↓" : "↑"}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <Link href={`/admin/faq/${entry.id}`} className="table-link">
                      {entry.question}
                    </Link>
                  </td>
                  <td>{entry.categorie || "—"}</td>
                  <td>{new Date(entry.updated_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
}
