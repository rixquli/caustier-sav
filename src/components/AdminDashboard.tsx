"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiDownload, FiInfo, FiPlus } from "react-icons/fi";
import { DemandeCardList } from "@/components/DemandeList";
import {
  ACTIVE_STATUSES,
  DEMANDE_STATUTS,
  DEMANDE_TYPES,
  getStatutInfo,
  getTypeLabel,
} from "@/lib/constants";
import { useRouter } from "next/navigation";
import type {
  DemandeAdminOption,
  DemandeClientOption,
  DemandeDisplay,
  DemandeMetaResponse,
  ListDemandesResponse,
} from "@/types/demande";
import type { UserDisplay } from "@/types/user";
import AdminCreateDemandeModal from "./AdminCreateDemandeModal";
import { TechnicienDisplay } from "@/types/technicien";

const DAY_MS = 1000 * 60 * 60 * 24;
const LATE_THRESHOLD_DAYS = 14;

const STATUS_COLORS: Record<string, string> = {
  nouvelle: "#2563eb",
  en_cours: "#16a34a",
  en_attente_client: "#7e22ce",
  resolue: "#15803d",
  fermee: "#64748b",
};

const TYPE_COLORS: Record<string, string> = {
  SAV: "#6366f1",
  IA: "#0ea5e9",
  QUESTION: "#14b8a6",
  AUTRE: "#64748b",
};

function daysBetween(a: string | null, b: string) {
  return (new Date(a ?? 0).getTime() - new Date(b).getTime()) / DAY_MS;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function clientName(d: DemandeDisplay) {
  return (
    [d.client_prenom, d.client_nom].filter(Boolean).join(" ") ||
    d.client_name ||
    ""
  );
}

function assigneeName(d: DemandeDisplay) {
  return d.assignee_name ?? "";
}

function exportCsv(demandes: DemandeDisplay[]) {
  const headers = [
    "ID",
    "Titre",
    "Client",
    "Type",
    "Priorité",
    "Statut",
    "Assigné à",
    "Créée le",
  ];
  const rows = demandes.map((d) => [
    d.id,
    d.titre ?? "",
    clientName(d),
    getTypeLabel(d.type),
    d.priorite ?? "",
    getStatutInfo(d.status).label,
    assigneeName(d),
    d.created_at ? new Date(d.created_at).toLocaleDateString("fr-FR") : "",
  ]);

  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(";"))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `requetes_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

type ChartRow = { key: string; label: string; value: number; color: string };

function ChartPanel({
  title,
  rows,
  total,
}: {
  title: string;
  rows: ChartRow[];
  total: number;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <h2>{title}</h2>
        <span className="page-muted" style={{ fontSize: "0.8rem" }}>
          {total} au total
        </span>
      </div>
      <div className="chart-list">
        {rows.map((r) => (
          <div className="chart-row" key={r.key}>
            <span className="chart-row-label">{r.label}</span>
            <span className="chart-track">
              <span
                className="chart-fill"
                style={{
                  width: `${(r.value / max) * 100}%`,
                  background: r.color,
                }}
              />
            </span>
            <span className="chart-row-value">{r.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminDashboard({ user }: { user: UserDisplay }) {
  const [demandes, setDemandes] = useState<DemandeDisplay[]>([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [unassigned, setUnassigned] = useState<DemandeDisplay[]>([]);
  const [highPriority, setHighPriority] = useState<DemandeDisplay[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [clients, setClients] = useState<DemandeClientOption[]>([]);
  const [admins, setAdmins] = useState<DemandeAdminOption[]>([]);
  const [technicians, setTechnicians] = useState<TechnicienDisplay[]>([]);
  const router = useRouter();

  useEffect(() => {
    // fetch("/api/demandes")
    //   .then((res) => (res.ok ? res.json() : { demandes: [] }))
    //   .then((data: ListDemandesResponse) => setDemandes(data.demandes ?? []));

    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setClientsCount(data.stats?.clients ?? 0);
        setUnassigned(data.unassigned ?? []);
        setHighPriority(data.highPriority ?? []);
      });
  }, []);

  const loadData = useCallback(async () => {
    const [demandesRes, metaRes, clientsRes] = await Promise.all([
      fetch("/api/demandes"),
      fetch("/api/demandes/meta"),
      fetch("/api/clients"),
    ]);
    const demandesData = demandesRes.ok
      ? ((await demandesRes.json()) as ListDemandesResponse)
      : { demandes: [] };
    const metaData = metaRes.ok
      ? ((await metaRes.json()) as DemandeMetaResponse)
      : { admins: [], technicians: [], clients: [] };
    const clientsData = clientsRes.ok
      ? ((await clientsRes.json()) as { clients?: DemandeClientOption[] })
      : { clients: [] };

    setDemandes(demandesData.demandes ?? []);
    setAdmins(metaData.admins ?? []);
    setTechnicians(
      (metaData.technicians ?? []).map(
        (technician): TechnicienDisplay => ({
          id: Number(technician.id),
          name: technician.name ?? "",
          specialite: technician.specialite ?? "",
          email: technician.email ?? "",
          telephone: technician.telephone ?? "",
          phone_number: technician.telephone ?? "",
          createdAt: "",
          updatedAt: "",
          notes: null,
          notes_admin: null,
          displayName: technician.name ?? "",
        }),
      ),
    );
    setClients(clientsData.clients ?? []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const actives = demandes.filter((d) => ACTIVE_STATUSES.includes(d.status));

    const resolved = demandes.filter((d) => d.resolved_at);
    const resolutionDays = resolved.map((d) =>
      daysBetween(d.resolved_at, d.created_at),
    );

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const resolvedThisMonth = resolved.filter(
      (d) =>
        d.resolved_at &&
        new Date(d.resolved_at).getTime() >= startOfMonth.getTime(),
    ).length;

    const openAges = actives.map(
      (d) => (now - new Date(d.created_at).getTime()) / DAY_MS,
    );

    const late = actives.filter(
      (d) =>
        (now - new Date(d.created_at).getTime()) / DAY_MS > LATE_THRESHOLD_DAYS,
    ).length;

    const byStatus = Object.keys(DEMANDE_STATUTS).map((key) => ({
      key,
      label: getStatutInfo(key).label,
      value: demandes.filter((d) => d.status === key).length,
      color: STATUS_COLORS[key] ?? "#16a34a",
    }));

    const byType = DEMANDE_TYPES.map((t) => ({
      key: t.value,
      label: t.label,
      value: demandes.filter((d) => d.type === t.value).length,
      color: TYPE_COLORS[t.value] ?? "#64748b",
    }));

    return {
      open: actives.length,
      late,
      unassigned: actives.filter((d) => !d.assigned_to).length,
      sav: actives.filter((d) => d.type === "SAV").length,
      ia: actives.filter((d) => d.type === "IA").length,
      resolues: demandes.filter((d) => d.status === "resolue").length,
      avgResolution: average(resolutionDays),
      resolvedThisMonth,
      avgOpenAge: average(openAges),
      byStatus,
      byType,
    };
  }, [demandes]);

  return (
    <>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>
              Tableau de bord
              <FiInfo
                aria-hidden="true"
                style={{
                  marginLeft: "0.5rem",
                  color: "#94a3b8",
                  verticalAlign: "middle",
                }}
                size={18}
              />
            </h1>
            <p>Bienvenue, {user?.displayName || user?.nom}.</p>
          </div>
          <div className="dashboard-button-container">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => exportCsv(demandes)}
              disabled={!demandes.length}
            >
              <FiDownload aria-hidden="true" />
              Exporter (CSV)
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                // router.push("/admin/demandes");
                setIsCreateModalOpen(true);
              }}
            >
              <FiPlus aria-hidden="true" />
              Créer une demande
            </button>
          </div>
        </div>

        <div className="dashboard-stats">
          <Link
            href="/admin/demandes?open=1"
            className="stat-card stat-card--link"
          >
            <span className="stat-card-label">Requêtes ouvertes</span>
            <span className="stat-card-value">{metrics.open}</span>
          </Link>
          {/* <Link
          href="/admin/demandes?late=1&open=1"
          className={`stat-card stat-card--link${metrics.late ? " stat-card--danger" : ""}`}
        >
          <span className="stat-card-label">En retard</span>
          <span className="stat-card-value">{metrics.late}</span>
        </Link> */}
          <Link
            href="/admin/demandes?unassigned=1&open=1"
            className={`stat-card stat-card--link${metrics.unassigned ? " stat-card--warning" : ""}`}
          >
            <span className="stat-card-label">Non assignées</span>
            <span className="stat-card-value">{metrics.unassigned}</span>
          </Link>
          {/* <Link
          href="/admin/demandes?type=SAV&open=1"
          className="stat-card stat-card--link stat-card--danger"
        >
          <span className="stat-card-label">SAV en cours</span>
          <span className="stat-card-value">{metrics.sav}</span>
        </Link> */}
          {/* <Link
          href="/admin/demandes?type=IA&open=1"
          className="stat-card stat-card--link stat-card--accent"
        >
          <span className="stat-card-label">Demandes IA</span>
          <span className="stat-card-value">{metrics.ia}</span>
        </Link> */}
          <Link
            href="/admin/demandes?status=resolue&open=0"
            className="stat-card stat-card--link stat-card--success"
          >
            <span className="stat-card-label">Résolues</span>
            <span className="stat-card-value">{metrics.resolues}</span>
          </Link>
          <Link href="/admin/clients" className="stat-card stat-card--link">
            <span className="stat-card-label">Clients</span>
            <span className="stat-card-value">{clientsCount}</span>
          </Link>
        </div>

        <h2 className="section-subtitle">Indicateurs de performance</h2>
        <div className="kpi-grid">
          <div className="stat-card">
            <span className="stat-card-label">Délai moyen de résolution</span>
            <span className="stat-card-value">
              {metrics.avgResolution.toFixed(1)} j
            </span>
            <span className="stat-card-sub">sur les requêtes résolues</span>
          </div>
          <div className="stat-card stat-card--success">
            <span className="stat-card-label">Résolues ce mois</span>
            <span className="stat-card-value">{metrics.resolvedThisMonth}</span>
            <span className="stat-card-sub">depuis le 1er du mois</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">
              Âge moyen des requêtes ouvertes
            </span>
            <span className="stat-card-value">
              {metrics.avgOpenAge.toFixed(1)} j
            </span>
            <span className="stat-card-sub">depuis leur création</span>
          </div>
        </div>

        <div className="charts-grid">
          <ChartPanel
            title="Requêtes par statut"
            rows={metrics.byStatus}
            total={demandes.length}
          />
          <ChartPanel
            title="Requêtes par type"
            rows={metrics.byType}
            total={demandes.length}
          />
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-panel dashboard-panel--wide">
            <div className="dashboard-panel-header">
              <div>
                <h2>Demandes non attribuées</h2>
                <p>À assigner rapidement à un technicien.</p>
              </div>
              <Link href="/admin/demandes" className="table-link">
                Voir tout
              </Link>
            </div>
            <DemandeCardList
              demandes={unassigned}
              detailBasePath="/admin/demandes"
              showClient
              emptyMessage="Toutes les demandes actives sont attribuées."
            />
          </section>

          <section className="dashboard-panel dashboard-panel--wide">
            <div className="dashboard-panel-header">
              <div>
                <h2>Priorités haute et critique</h2>
                <p>
                  Demandes actives triées du niveau le plus urgent au moins
                  urgent.
                </p>
              </div>
              <Link href="/admin/demandes" className="table-link">
                Voir tout
              </Link>
            </div>
            <DemandeCardList
              demandes={highPriority}
              detailBasePath="/admin/demandes"
              showClient
              emptyMessage="Aucune demande haute ou critique active."
            />
          </section>

          <section className="dashboard-panel dashboard-panel--actions">
            <h2>Actions rapides</h2>
            <div className="quick-actions">
              <Link href="/admin/demandes" className="quick-action">
                Gérer les demandes
              </Link>
              <Link href="/admin/clients?new=1" className="quick-action">
                Créer un client
              </Link>
              <Link href="/admin/clients" className="quick-action">
                Liste des clients
              </Link>
              <Link href="/admin/faq" className="quick-action">
                Gérer la FAQ
              </Link>
            </div>
          </section>
        </div>
      </div>

      {isCreateModalOpen && (
        <AdminCreateDemandeModal
          clients={clients}
          admins={admins}
          technicians={technicians}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(demande) => {
            setDemandes((prev) => [demande, ...prev]);
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </>
  );
}
