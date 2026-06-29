"use client";
import { Ticket } from "@/types/ticket";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ApiTicket = {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at?: string;
  assigned_to?: number | string | null;
};

function mapApiTicket(ticket: ApiTicket): Ticket {
  const priorityMap: Record<string, Ticket["priority"]> = {
    Basse: "Basse",
    Normal: "Moyenne",
    Moyenne: "Moyenne",
    Haute: "Haute",
    Critique: "Critique",
  };
  const statutMap: Record<string, Ticket["statut"]> = {
    Ouvert: "Ouverte",
    Ouverte: "Ouverte",
    "En cours": "En cours",
    Résolu: "Résolu",
    Fermé: "Fermé",
  };

  return {
    id: String(ticket.id),
    title: ticket.title,
    description: ticket.description,
    priority: priorityMap[ticket.priority] ?? "Moyenne",
    statut: statutMap[ticket.status] ?? "Ouverte",
    creationDate: ticket.created_at ? new Date(ticket.created_at) : new Date(),
    assignTo: ticket.assigned_to ? String(ticket.assigned_to) : "—",
  };
}

const columns = [
  { accessorKey: "id", header: "Id" },
  { accessorKey: "title", header: "Titre" },
  { accessorKey: "assignTo", header: "Assigné à" },
  { accessorKey: "priority", header: "Priorité" },
  { accessorKey: "statut", header: "Statut" },
];

const STATUTS = ["Tous", "Ouverte", "En cours", "Fermé"];
const PRIORITIES = ["Toutes", "Basse", "Moyenne", "Haute", "Critique"];

export default function TicketTable() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const { push } = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadTickets() {
      try {
        const response = await fetch("/api/tickets");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message ?? `Erreur ${response.status}`);
        }

        console.log("tickets:", data);
        setTickets(data.map(mapApiTicket));
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Impossible de charger les tickets";
        console.error("Erreur chargement tickets:", message);
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  const table = useReactTable({
    data: tickets,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) {
    return <p>Chargement des tickets...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div>
      <div className="vos-tickets-header">
        <input
          className="input-bar"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Rechercher..."
        />

        <div className="dropdown-container">
          <div className="dropdown-item">
            <label>Statut</label>
            <select
              onChange={(e) =>
                table
                  .getColumn("statut")
                  ?.setFilterValue(
                    e.target.value === "Tous" ? undefined : e.target.value,
                  )
              }
            >
              {STATUTS.map((statut) => (
                <option key={statut} value={statut}>
                  {statut}
                </option>
              ))}
            </select>
          </div>

          <div className="dropdown-item">
            <label>Priorité:</label>
            <select
              onChange={(e) =>
                table
                  .getColumn("priority")
                  ?.setFilterValue(
                    e.target.value === "Toutes" ? undefined : e.target.value,
                  )
              }
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {tickets.length === 0 ? (
        <p>Aucun ticket pour le moment.</p>
      ) : (
        <table className="tickets-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    <div
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        cursor: header.column.getCanSort()
                          ? "pointer"
                          : "default",
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {
                        { asc: " ↑", desc: " ↓" }[
                          header.column.getIsSorted() as string
                        ]
                      }
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => push(`${pathname}/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
