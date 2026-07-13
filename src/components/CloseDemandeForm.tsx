"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiErrorResponse, UpdateDemandeResponse } from "@/types/demande";
import type {
  DemandeCloseFormProps,
  DemandeCloseFormState,
} from "@/types/demande/forms";

export default function CloseDemandeForm({
  onSuccess,
  demande,
}: DemandeCloseFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<DemandeCloseFormState>({
    message: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof DemandeCloseFormState>(
    key: K,
    value: DemandeCloseFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body: Record<string, unknown> = {
      closed_message: form.message,
      status: "fermee",
    };

    const res = await fetch(`/api/demandes/${demande.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as UpdateDemandeResponse | ApiErrorResponse;

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
      router.push(`/admin/demandes/${demande.id}`);
    }
    setLoading(false);
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-field">
        <label htmlFor="message">Message de clôture</label>
        <textarea
          name="message"
          id="message"
          value={form.message}
          onChange={(e) => setField("message", e.target.value)}
        ></textarea>
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
