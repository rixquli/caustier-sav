"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMANDE_PRIORITES, DEMANDE_TYPES } from "@/lib/constants";

export default function DemandeForm({ machines = [], onSuccess, adminMode = false, clients = [], admins = [] }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("SAV");
  const [priorite, setPriorite] = useState("normale");
  const [machineId, setMachineId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body = {
        titre,
        description,
        type,
        priorite,
        machineId: machineId || null,
      };

      if (adminMode) {
        body.userId = userId;
        body.assignedTo = assignedTo || null;
      }

      const res = await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la création.");
        return;
      }

      if (onSuccess) {
        onSuccess(data.demande);
      } else {
        router.push(`/demandes/${data.demande.id}`);
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      {adminMode && (
        <>
          <div className="form-field">
            <label htmlFor="client">Client</label>
            <select id="client" value={userId} onChange={(e) => setUserId(e.target.value)} required>
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {[c.prenom, c.nom].filter(Boolean).join(" ")} ({c.email})
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="assignedTo">Assigné à</label>
            <select id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">Non assignée</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {[a.prenom, a.nom].filter(Boolean).join(" ") || a.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="form-field">
        <label htmlFor="titre">Titre</label>
        <input id="titre" value={titre} onChange={(e) => setTitre(e.target.value)} required />
      </div>

      <div className="form-field">
        <label htmlFor="description">Description</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="type">Type</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            {DEMANDE_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="priorite">Priorité</label>
          <select id="priorite" value={priorite} onChange={(e) => setPriorite(e.target.value)}>
            {DEMANDE_PRIORITES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="machine">Machine (optionnel)</label>
        {machines.length > 0 ? (
          <select id="machine" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
            <option value="">Non renseigné</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>{m.nom}</option>
            ))}
          </select>
        ) : (
          <p className="page-muted">Aucune machine associée — la demande sera créée sans machine.</p>
        )}
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Envoi…" : "Créer la demande"}
      </button>
    </form>
  );
}
