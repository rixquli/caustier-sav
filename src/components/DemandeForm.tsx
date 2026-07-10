"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMANDE_PRIORITES, DEMANDE_TYPES } from "@/lib/constants";
import type {
  ApiErrorResponse,
  CreateDemandeResponse,
  DemandeCreateFormState,
  DemandeFormProps,
  DemandeMachineOption,
} from "@/types/demande";
import { createDemande } from "@/app/actions/demandes";
import { useAction } from "next-safe-action/hooks";

const EMPTY_FORM: DemandeCreateFormState = {
  userId: "",
  titre: "",
  description: "",
  type: "SAV",
  priorite: "normale",
  machineId: "",
  assignedTo: "",
};

export default function DemandeForm({
  technicians = [],
  machines = [],
  onSuccess,
  adminMode = false,
  clients = [],
}: DemandeFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<DemandeCreateFormState>(EMPTY_FORM);
  const [clientMachines, setClientMachines] = useState<DemandeMachineOption[]>(
    [],
  );
  const [error, setError] = useState("");
  // const [loading, setLoading] = useState(false);

  const { executeAsync, isExecuting } = useAction(createDemande, {
    onSuccess: ({ data }) => {
      if (data?.demande) {
        onSuccess
          ? onSuccess(data.demande)
          : router.push(`/demandes/${data.demande.id}`);
      }
    },
    onError: ({ error }) => {
      setError(error.serverError ?? "Erreur lors de la création.");
    },
  });

  const availableMachines = adminMode ? clientMachines : machines;

  function setField<K extends keyof DemandeCreateFormState>(
    key: K,
    value: DemandeCreateFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!adminMode) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setField("machineId", "");
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
    // setLoading(true);

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
        body.assignedTo = form.assignedTo || null;
      }
      executeAsync({
        titre: form.titre,
        description: form.description,
        type: form.type,
        priorite: form.priorite,
        machineId: form.machineId || null,
        userId: adminMode ? form.userId : undefined,
        assignedTo: adminMode ? form.assignedTo || null : undefined,
      });
    } catch {
      setError("Impossible de contacter le serveur.");
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
              onChange={(e) => setField("userId", e.target.value)}
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
                  {a.displayName || a.name}
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

      {availableMachines.length > 0 ? (
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
      ) : adminMode && form.userId ? (
        <p className="page-muted">Aucune machine enregistrée pour ce client.</p>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={isExecuting}>
        {isExecuting ? "Envoi…" : "Créer la demande"}
      </button>
    </form>
  );
}
