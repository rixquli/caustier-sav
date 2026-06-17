"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";

const EMPTY_MACHINE = {
  nom: "",
  marque: "",
  produits_calibres: "",
  version_logiciel: "",
  date_mise_en_service: "",
  pilote_ligne: "",
  technicien_charge: "",
  nombre_lignes: "",
  serveurs_vision: "",
  notes_internes: "",
};

export default function AdminClientDetailPage({ params }) {
  const router = useRouter();
  const [id, setId] = useState(null);
  const [client, setClient] = useState(null);
  const [machines, setMachines] = useState([]);
  const [form, setForm] = useState({});
  const [machineForm, setMachineForm] = useState(EMPTY_MACHINE);
  const [editingMachineId, setEditingMachineId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);

  async function load() {
    if (!id) return;
    const res = await fetch(`/api/clients/${id}`);
    if (!res.ok) { setClient(null); return; }
    const data = await res.json();
    setClient(data.client);
    setMachines(data.machines ?? []);
    setForm({
      nom: data.client.nom ?? "",
      prenom: data.client.prenom ?? "",
      email: data.client.email ?? "",
      phone: data.client.phone ?? "",
      adresse: data.client.adresse ?? "",
      archived: Boolean(data.client.archived),
    });
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setMessage("Client mis à jour.");
      await load();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!confirm("Réinitialiser le mot de passe ?")) return;
    const res = await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: true }),
    });
    const data = await res.json();
    if (res.ok) {
      setTempPassword(data.tempPassword);
      setMessage("Mot de passe réinitialisé.");
    }
  }

  async function handleArchive() {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !form.archived }),
    });
    if (res.ok) await load();
  }

  async function handleMachineSubmit(e) {
    e.preventDefault();
    const url = `/api/clients/${id}/machines`;
    const method = editingMachineId ? "PATCH" : "POST";
    const body = editingMachineId
      ? { machineId: editingMachineId, ...machineForm, nombre_lignes: machineForm.nombre_lignes ? Number(machineForm.nombre_lignes) : null }
      : { ...machineForm, nombre_lignes: machineForm.nombre_lignes ? Number(machineForm.nombre_lignes) : null };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setMachineForm(EMPTY_MACHINE);
      setEditingMachineId(null);
      await load();
    }
  }

  async function handleDeleteMachine(machineId) {
    if (!confirm("Supprimer cette machine ?")) return;
    await fetch(`/api/clients/${id}/machines?machineId=${machineId}`, { method: "DELETE" });
    await load();
  }

  if (loading) return <PageLayout title="Client"><p className="page-muted">Chargement…</p></PageLayout>;
  if (!client) return <PageLayout title="Introuvable"><p>Client introuvable.</p></PageLayout>;

  return (
    <PageLayout
      title={[client.prenom, client.nom].filter(Boolean).join(" ") || client.displayName}
      description={client.email}
    >
      {message && <div className="alert alert-success">{message}</div>}
      {tempPassword && (
        <div className="alert alert-info">
          Nouveau mot de passe temporaire : <strong>{tempPassword}</strong>
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      <form className="form-card" onSubmit={handleSave}>
        <div className="form-row">
          <div className="form-field">
            <label>Prénom</label>
            <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Nom</label>
            <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          </div>
        </div>
        <div className="form-field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="form-field">
          <label>Téléphone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="form-field">
          <label>Adresse</label>
          <textarea value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} rows={2} />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleResetPassword}>
            Réinitialiser mot de passe
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleArchive}>
            {form.archived ? "Désarchiver" : "Archiver"}
          </button>
        </div>
      </form>

      <section className="page-section">
        <h2>Machines ({machines.length})</h2>
        {machines.length > 0 && (
          <ul className="machine-admin-list">
            {machines.map((m) => (
              <li key={m.id} className="machine-item">
                <strong>{m.nom}</strong>
                {m.marque && <span> — {m.marque}</span>}
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                    setEditingMachineId(m.id);
                    setMachineForm({ ...m, nombre_lignes: m.nombre_lignes ?? "" });
                  }}>Modifier</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteMachine(m.id)}>Supprimer</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form className="form-card" onSubmit={handleMachineSubmit}>
          <h3>{editingMachineId ? "Modifier la machine" : "Ajouter une machine"}</h3>
          <div className="form-row">
            <div className="form-field">
              <label>Nom</label>
              <input value={machineForm.nom} onChange={(e) => setMachineForm({ ...machineForm, nom: e.target.value })} required />
            </div>
            <div className="form-field">
              <label>Marque</label>
              <input value={machineForm.marque} onChange={(e) => setMachineForm({ ...machineForm, marque: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Produits calibrés</label>
              <input value={machineForm.produits_calibres} onChange={(e) => setMachineForm({ ...machineForm, produits_calibres: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Version logiciel</label>
              <input value={machineForm.version_logiciel} onChange={(e) => setMachineForm({ ...machineForm, version_logiciel: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Date mise en service</label>
              <input type="date" value={machineForm.date_mise_en_service ?? ""} onChange={(e) => setMachineForm({ ...machineForm, date_mise_en_service: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Nombre de lignes</label>
              <input type="number" value={machineForm.nombre_lignes} onChange={(e) => setMachineForm({ ...machineForm, nombre_lignes: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Pilote de ligne</label>
              <input value={machineForm.pilote_ligne} onChange={(e) => setMachineForm({ ...machineForm, pilote_ligne: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Technicien en charge</label>
              <input value={machineForm.technicien_charge} onChange={(e) => setMachineForm({ ...machineForm, technicien_charge: e.target.value })} />
            </div>
          </div>
          <div className="form-field">
            <label>Serveurs / PC vision</label>
            <input value={machineForm.serveurs_vision} onChange={(e) => setMachineForm({ ...machineForm, serveurs_vision: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Notes internes</label>
            <textarea value={machineForm.notes_internes} onChange={(e) => setMachineForm({ ...machineForm, notes_internes: e.target.value })} rows={2} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingMachineId ? "Mettre à jour" : "Ajouter"}
            </button>
            {editingMachineId && (
              <button type="button" className="btn btn-secondary" onClick={() => {
                setEditingMachineId(null);
                setMachineForm(EMPTY_MACHINE);
              }}>Annuler</button>
            )}
          </div>
        </form>
      </section>
    </PageLayout>
  );
}
