"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMANDE_PRIORITES,
  DEMANDE_STATUTS,
  DEMANDE_TYPES,
} from "@/lib/constants";

export default function EditableDemandeForm({
  onSuccess,
  adminMode = false,
  demande,
  clients = [],
  admins = [],
  machines = [],
}) {
  const router = useRouter();
  const [userId, setUserId] = useState(demande?.user_id || "");
  const [titre, setTitre] = useState(demande?.titre || "");
  const [description, setDescription] = useState(demande?.description || "");
  const [type, setType] = useState(demande?.type || "SAV");
  const [priorite, setPriorite] = useState(demande?.priorite || "normale");
  const [status, setStatus] = useState(demande?.status || "nouvelle");
  const [machineId, setMachineId] = useState(demande?.machine_id || "");
  const [assignedTo, setAssignedTo] = useState(demande?.assigned_to || "");
  const [notesAdmin, setNotesAdmin] = useState(demande?.notes_admin || "");
  const [clientMachines, setClientMachines] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const availableMachines = adminMode ? clientMachines : machines;

  useEffect(() => {
    if (!adminMode) return;
    if (!userId) {
      setClientMachines([]);
      return;
    }

    let active = true;
    fetch(`/api/clients/${userId}/machines`)
      .then((res) => (res.ok ? res.json() : { machines: [] }))
      .then((data) => {
        if (active) setClientMachines(data.machines ?? []);
      });

    return () => {
      active = false;
    };
  }, [userId, adminMode]);

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
        body.status = status;
        body.assignedTo = assignedTo || null;
        body.notes_admin = notesAdmin;
      }

      const res = await fetch(`/api/demandes/${demande.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'enregistrement.");
        return;
      }

      if (onSuccess) {
        onSuccess(data.demande);
      } else {
        router.push(`/admin/demandes/${data.demande.id}`);
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
            <select
              id="client"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setMachineId("");
              }}
              required
            >
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
            <select
              id="assignedTo"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
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
        <input
          id="titre"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {DEMANDE_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="priorite">Priorité</label>
          <select
            id="priorite"
            value={priorite}
            onChange={(e) => setPriorite(e.target.value)}
          >
            {DEMANDE_PRIORITES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {adminMode && (
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="status">Statut</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {Object.entries(DEMANDE_STATUTS).map(([value, info]) => (
                <option key={value} value={value}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="machine">Machine (optionnel)</label>
            <select
              id="machine"
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
            >
              <option value="">Non renseigné</option>
              {availableMachines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!adminMode && availableMachines.length > 0 && (
        <div className="form-field">
          <label htmlFor="machine">Machine (optionnel)</label>
          <select
            id="machine"
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
          >
            <option value="">Non renseigné</option>
            {availableMachines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
        </div>
      )}

      {adminMode && userId && availableMachines.length === 0 && (
        <p className="page-muted">Aucune machine enregistrée pour ce client.</p>
      )}

      {adminMode && (
        <div className="form-field">
          <label htmlFor="notes_admin">Notes internes admin</label>
          <textarea
            id="notes_admin"
            value={notesAdmin}
            onChange={(e) => setNotesAdmin(e.target.value)}
            rows={4}
            placeholder="Observations internes, suivi technique, consignes... Invisible pour le client."
          />
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
