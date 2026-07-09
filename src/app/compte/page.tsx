"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import type { ClientMachineSummary, ProfileResponse } from "@/types/user";
import type { ApiErrorResponse } from "@/types/user";

export default function ComptePage() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [machines, setMachines] = useState<ClientMachineSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProfileResponse | null) => {
        if (data?.user) {
          setNom(data.user.nom ?? "");
          setPrenom(data.user.prenom ?? "");
          setEmail(data.user.email ?? "");
          setPhone(data.user.phone ?? "");
          setAdresse(data.user.adresse ?? "");
          setMachines(data.machines ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, prenom, phone, adresse }),
      });
      const data = (await res.json()) as ProfileResponse | ApiErrorResponse;
      if (!res.ok) {
        setError("error" in data ? data.error : "Erreur.");
        return;
      }
      setMessage("Profil mis à jour.");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageLayout title="Mon profil" description="Consultez et modifiez vos informations.">
      {loading ? (
        <p className="page-muted">Chargement…</p>
      ) : (
        <>
          <form className="form-card" onSubmit={handleSubmit}>
            {message && <div className="alert alert-success">{message}</div>}
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
              <input id="email" value={email} disabled />
            </div>

            <div className="form-field">
              <label htmlFor="phone">Téléphone</label>
              <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="form-field">
              <label htmlFor="adresse">Adresse</label>
              <textarea id="adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} rows={2} />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>

          <section className="page-section">
            <h2>Machines associées</h2>
            {machines.length === 0 ? (
              <p className="page-muted">Aucune machine enregistrée.</p>
            ) : (
              <ul className="machine-list">
                {machines.map((m) => (
                  <li key={m.id} className="machine-item">
                    <strong>{m.nom}</strong>
                    {m.marque && <span> — {m.marque}</span>}
                    {m.version_logiciel && <p className="page-muted">Version : {m.version_logiciel}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="page-section">
            <Link href="/compte/changer-mot-de-passe" className="btn btn-secondary">
              Changer mon mot de passe
            </Link>
          </section>
        </>
      )}
    </PageLayout>
  );
}
