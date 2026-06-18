"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiArrowLeft,
  FiPlus,
  FiChevronDown,
  FiTrash2,
} from "react-icons/fi";
import { LuPencil } from "react-icons/lu";
import ClientEditModal from "@/components/ClientEditModal";
import {
  getStatutInfo,
  getTypeBadge,
  getTypeLabel,
} from "@/lib/constants";

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

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export default function AdminClientDetailPage({ params }) {
  const [id, setId] = useState(null);
  const [client, setClient] = useState(null);
  const [machines, setMachines] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [machineForm, setMachineForm] = useState(EMPTY_MACHINE);
  const [editingMachineId, setEditingMachineId] = useState(null);
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [editingClient, setEditingClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  async function load() {
    if (!id) return;
    const [clientRes, demandesRes] = await Promise.all([
      fetch(`/api/clients/${id}`),
      fetch("/api/demandes"),
    ]);
    if (!clientRes.ok) {
      setClient(null);
      return;
    }
    const data = await clientRes.json();
    setClient(data.client);
    setMachines(data.machines ?? []);
    if (expandedId === null && (data.machines ?? []).length > 0) {
      setExpandedId(data.machines[0].id);
    }
    const demandesData = demandesRes.ok ? await demandesRes.json() : { demandes: [] };
    setDemandes(
      (demandesData.demandes ?? []).filter((d) => d.user_id === id),
    );
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  function openAddMachine() {
    setEditingMachineId(null);
    setMachineForm(EMPTY_MACHINE);
    setShowMachineForm(true);
  }

  function openEditMachine(m) {
    setEditingMachineId(m.id);
    setMachineForm({ ...EMPTY_MACHINE, ...m, nombre_lignes: m.nombre_lignes ?? "" });
    setShowMachineForm(true);
  }

  async function handleMachineSubmit(e) {
    e.preventDefault();
    const url = `/api/clients/${id}/machines`;
    const method = editingMachineId ? "PATCH" : "POST";
    const payload = {
      ...machineForm,
      nombre_lignes: machineForm.nombre_lignes ? Number(machineForm.nombre_lignes) : null,
    };
    const body = editingMachineId
      ? { machineId: editingMachineId, ...payload }
      : payload;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setMachineForm(EMPTY_MACHINE);
      setEditingMachineId(null);
      setShowMachineForm(false);
      await load();
    }
  }

  async function handleDeleteMachine(machineId) {
    if (!confirm("Supprimer cette calibreuse ?")) return;
    await fetch(`/api/clients/${id}/machines?machineId=${machineId}`, {
      method: "DELETE",
    });
    await load();
  }

  if (loading) {
    return (
      <div className="page">
        <p className="page-muted">Chargement…</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="page">
        <Link href="/admin/clients" className="back-link">
          <FiArrowLeft aria-hidden="true" /> Retour
        </Link>
        <div className="empty-state">
          <p>Client introuvable.</p>
        </div>
      </div>
    );
  }

  const clientName =
    [client.prenom, client.nom].filter(Boolean).join(" ") || client.displayName;

  return (
    <div className="page">
      <Link href="/admin/clients" className="back-link">
        <FiArrowLeft aria-hidden="true" /> Retour
      </Link>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="detail-topbar">
        <div className="detail-title-meta">
          <h1>{clientName}</h1>
          <span className="badge badge--muted">
            {machines.length} calibreuse{machines.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="detail-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setEditingClient(true)}
          >
            <LuPencil size={15} /> Modifier
          </button>
        </div>
      </div>

      <div className="detail-layout detail-layout--aside-left">
        <aside className="detail-side">
          <section className="side-card">
            <h3>Client</h3>
            <div className="info-rows">
              <div className="info-row">
                <span className="info-row-label">Adresse</span>
                <span className="info-row-value">{client.adresse || "—"}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Email</span>
                <span className="info-row-value">{client.email || "—"}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Téléphone</span>
                <span className="info-row-value">{client.phone || "—"}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Statut</span>
                <span className="info-row-value">
                  {client.archived ? "Archivé" : "Actif"}
                </span>
              </div>
            </div>
            {client.notes_admin && (
              <>
                <h3 style={{ marginTop: "1.25rem" }}>Notes internes</h3>
                <p className="client-summary-note">{client.notes_admin}</p>
              </>
            )}
          </section>
        </aside>

        <div className="detail-main">
          <section className="page-card">
            <div className="section-head">
              <h2>Calibreuses</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openAddMachine}
              >
                <FiPlus aria-hidden="true" /> Ajouter une calibreuse
              </button>
            </div>

            {machines.length === 0 && !showMachineForm ? (
              <p className="page-muted">Aucune calibreuse enregistrée.</p>
            ) : (
              <div>
                {machines.map((m) => {
                  const open = expandedId === m.id;
                  return (
                    <div className="machine-card" key={m.id}>
                      <button
                        type="button"
                        className="machine-card-header"
                        onClick={() => setExpandedId(open ? null : m.id)}
                        aria-expanded={open}
                      >
                        <span className="machine-card-title">{m.nom}</span>
                        {m.marque && (
                          <span className="badge badge-type badge-type--sav">
                            {m.marque}
                          </span>
                        )}
                        {m.nombre_lignes ? (
                          <span className="machine-card-count">
                            {m.nombre_lignes} ligne{m.nombre_lignes > 1 ? "s" : ""}
                          </span>
                        ) : null}
                        <span className="machine-card-spacer" />
                        <span className="machine-card-actions" onClick={(e) => e.stopPropagation()}>
                          <span
                            className="icon-btn"
                            role="button"
                            tabIndex={0}
                            aria-label="Modifier"
                            onClick={() => openEditMachine(m)}
                            onKeyDown={(e) => e.key === "Enter" && openEditMachine(m)}
                          >
                            <LuPencil size={14} />
                          </span>
                          <span
                            className="icon-btn icon-btn--danger"
                            role="button"
                            tabIndex={0}
                            aria-label="Supprimer"
                            onClick={() => handleDeleteMachine(m.id)}
                            onKeyDown={(e) => e.key === "Enter" && handleDeleteMachine(m.id)}
                          >
                            <FiTrash2 size={14} />
                          </span>
                        </span>
                        <FiChevronDown
                          className={`machine-card-chevron${open ? " machine-card-chevron--open" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                      {open && (
                        <div className="machine-card-body">
                          <div className="info-rows">
                            <div className="info-row">
                              <span className="info-row-label">Produits</span>
                              <span className="info-row-value">
                                {m.produits_calibres || "—"}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-row-label">Version logiciel</span>
                              <span className="info-row-value">
                                {m.version_logiciel || "—"}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-row-label">Mise en service</span>
                              <span className="info-row-value">
                                {m.date_mise_en_service
                                  ? formatDate(m.date_mise_en_service)
                                  : "—"}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-row-label">Pilote de ligne</span>
                              <span className="info-row-value">
                                {m.pilote_ligne || "—"}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-row-label">Technicien</span>
                              <span className="info-row-value">
                                {m.technicien_charge || "—"}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-row-label">Serveurs / PC de vision</span>
                              <span className="info-row-value">
                                {m.serveurs_vision || "—"}
                              </span>
                            </div>
                            {m.notes_internes && (
                              <div className="info-row">
                                <span className="info-row-label">Notes</span>
                                <span className="info-row-value">
                                  {m.notes_internes}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {showMachineForm && (
              <form
                className="form-card form-card--inline"
                style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-subtle)" }}
                onSubmit={handleMachineSubmit}
              >
                <h3>{editingMachineId ? "Modifier la calibreuse" : "Nouvelle calibreuse"}</h3>
                <div className="form-row">
                  <div className="form-field">
                    <label>Nom</label>
                    <input
                      value={machineForm.nom}
                      onChange={(e) => setMachineForm({ ...machineForm, nom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Marque</label>
                    <input
                      value={machineForm.marque}
                      onChange={(e) => setMachineForm({ ...machineForm, marque: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Produits calibrés</label>
                    <input
                      value={machineForm.produits_calibres}
                      onChange={(e) =>
                        setMachineForm({ ...machineForm, produits_calibres: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Version logiciel</label>
                    <input
                      value={machineForm.version_logiciel}
                      onChange={(e) =>
                        setMachineForm({ ...machineForm, version_logiciel: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Date mise en service</label>
                    <input
                      type="date"
                      value={machineForm.date_mise_en_service ?? ""}
                      onChange={(e) =>
                        setMachineForm({ ...machineForm, date_mise_en_service: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Nombre de lignes</label>
                    <input
                      type="number"
                      value={machineForm.nombre_lignes}
                      onChange={(e) =>
                        setMachineForm({ ...machineForm, nombre_lignes: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Pilote de ligne</label>
                    <input
                      value={machineForm.pilote_ligne}
                      onChange={(e) =>
                        setMachineForm({ ...machineForm, pilote_ligne: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Technicien en charge</label>
                    <input
                      value={machineForm.technicien_charge}
                      onChange={(e) =>
                        setMachineForm({ ...machineForm, technicien_charge: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label>Serveurs / PC de vision</label>
                  <input
                    value={machineForm.serveurs_vision}
                    onChange={(e) =>
                      setMachineForm({ ...machineForm, serveurs_vision: e.target.value })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>Notes internes</label>
                  <textarea
                    value={machineForm.notes_internes}
                    onChange={(e) =>
                      setMachineForm({ ...machineForm, notes_internes: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingMachineId ? "Mettre à jour" : "Ajouter"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowMachineForm(false);
                      setEditingMachineId(null);
                      setMachineForm(EMPTY_MACHINE);
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="page-card">
            <h2 style={{ marginBottom: "0.5rem" }}>Requêtes de ce client</h2>
            {demandes.length === 0 ? (
              <p className="page-muted">Aucune requête pour ce client.</p>
            ) : (
              <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Type</th>
                      <th>Statut</th>
                      <th>Créée le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandes.map((d) => {
                      const statut = getStatutInfo(d.status);
                      return (
                        <tr key={d.id}>
                          <td>
                            <Link
                              href={`/admin/demandes/${d.id}`}
                              className="table-link"
                            >
                              {d.titre}
                            </Link>
                          </td>
                          <td>
                            <span className={`badge badge-type ${getTypeBadge(d.type)}`}>
                              {getTypeLabel(d.type)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${statut.badge}`}>{statut.label}</span>
                          </td>
                          <td>{formatDate(d.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {editingClient && (
        <ClientEditModal
          client={client}
          onClose={() => setEditingClient(false)}
          onUpdated={(updated) => {
            setClient((prev) => ({ ...prev, ...updated }));
            setMessage("Client mis à jour.");
          }}
        />
      )}
    </div>
  );
}
