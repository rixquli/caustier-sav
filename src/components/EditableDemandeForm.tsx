"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMANDE_PRIORITES,
  DEMANDE_STATUTS,
  DEMANDE_TYPES,
} from "@/lib/constants";
import type {
  ApiErrorResponse,
  DemandeEditFormState,
  DemandeMachineOption,
  EditableDemandeFormProps,
  UpdateDemandeResponse,
} from "@/types/demande";

export default function EditableDemandeForm({
  onSuccess,
  adminMode = false,
  demande,
  clients = [],
  machines = [],
  technicians = [],
}: EditableDemandeFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<DemandeEditFormState>({
    userId: demande.user_id || "",
    titre: demande.titre || "",
    description: demande.description || "",
    type: demande.type || "SAV",
    priorite: demande.priorite || "normale",
    status: demande.status || "nouvelle",
    machineId: demande.machine_id ? String(demande.machine_id) : "",
    assignedTo: demande.assigned_to || "",
    notesAdmin: demande.notes_admin || "",
  });
  const [clientMachines, setClientMachines] = useState<DemandeMachineOption[]>(
    [],
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const availableMachines = adminMode ? clientMachines : machines;

  function setField<K extends keyof DemandeEditFormState>(
    key: K,
    value: DemandeEditFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!adminMode) return;
    if (!form.userId) {
      setClientMachines([]);
      return;
    }

    let active = true;
    fetch(`/api/clients/${form.userId}/machines`)
      .then((res) => (res.ok ? res.json() : { machines: [] }))
      .then((data: { machines?: DemandeMachineOption[] }) => {
        if (active) setClientMachines(data.machines ?? []);
      });

    return () => {
      active = false;
    };
  }, [form.userId, adminMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        titre: form.titre,
        description: form.description,
        type: form.type,
        priorite: form.priorite,
        machineId: form.machineId || null,
      };

      if (adminMode) {
        body.userId = form.userId;
        body.status = form.status;
        body.assignedTo = form.assignedTo || null;
        body.notes_admin = form.notesAdmin;
      }

      const res = await fetch(`/api/demandes/${demande.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as
        | UpdateDemandeResponse
        | ApiErrorResponse;

      if (!res.ok) {
        setError(
          "error" in data ? data.error : "Erreur lors de l'enregistrement.",
        );
        return;
      }

      const success = data as UpdateDemandeResponse;
      if (onSuccess) {
        onSuccess(success.demande);
      } else {
        router.push(`/admin/demandes/${success.demande.id}`);
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
              value={form.userId}
              onChange={(e) => {
                setField("userId", e.target.value);
                setField("machineId", "");
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
              value={form.assignedTo}
              onChange={(e) => setField("assignedTo", e.target.value)}
            >
              <option value="">Non assignée</option>
              {technicians.map((a) => (
                <option key={a.id} value={a.id}>
                  {[a.name, a.specialite].filter(Boolean).join(" ") || a.name}
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
          value={form.titre}
          onChange={(e) => setField("titre", e.target.value)}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={5}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            value={form.type}
            onChange={(e) => setField("type", e.target.value)}
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
            value={form.priorite}
            onChange={(e) => setField("priorite", e.target.value)}
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
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
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
              value={form.machineId}
              onChange={(e) => setField("machineId", e.target.value)}
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
            value={form.machineId}
            onChange={(e) => setField("machineId", e.target.value)}
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

      {adminMode && form.userId && availableMachines.length === 0 && (
        <p className="page-muted">Aucune machine enregistrée pour ce client.</p>
      )}

      {adminMode && (
        <div className="form-field">
          <label htmlFor="notes_admin">Notes internes admin</label>
          <textarea
            id="notes_admin"
            value={form.notesAdmin}
            onChange={(e) => setField("notesAdmin", e.target.value)}
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
