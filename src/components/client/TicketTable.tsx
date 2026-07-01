"use client";
import { Status, Priority, Ticket } from "@/types/ticket";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  Row,
} from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "../Button";
import { FaToggleOff, FaToggleOn } from "react-icons/fa";

type ApiTicket = {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at?: string;
  assigned_to?: number | string | null;
  assigned_to_name?: string | null;
};

function mapApiTicket(ticket: ApiTicket): Omit<Ticket, "created_by"> {
  const priorityMap: Record<string, Ticket["priority"]> = {
    Basse: Priority.Basse,
    Normal: Priority.Normal,
    Haute: Priority.Haute,
    Critique: Priority.Critique,
  };
  const statutMap: Record<string, Ticket["status"]> = {
    Ouvert: Status.Ouvert,
    Fermé: Status.Fermé,
  };

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    priority: priorityMap[ticket.priority] ?? Priority.Normal,
    status: statutMap[ticket.status] ?? Status.Ouvert,
    created_at: ticket.created_at
      ? new Date(ticket.created_at).toString()
      : new Date().toString(),
    assigned_to: ticket.assigned_to ? Number(ticket.assigned_to) : undefined,
    assigned_to_name: ticket.assigned_to_name ?? undefined,
  };
}

const columns = [
  { accessorKey: "id", header: "Id" },
  { accessorKey: "title", header: "Titre" },
  {
    accessorKey: "assigned_to_name",
    header: "Assigné à",
    filterFn: (row: Row<Ticket>, columnId: string, filterValue: boolean) => {
      // Si le filtre n'est pas actif (false/undefined), on affiche tout
      if (!filterValue) return true;
      // Si le filtre est actif, on affiche seulement les non-assignés
      const value = row.getValue(columnId);
      return value === null || value === undefined;
    },
  },
  { accessorKey: "priority", header: "Priorité" },
  { accessorKey: "status", header: "Statut" },
];

const STATUTS = ["Tous", ...Object.values(Status)];
const PRIORITIES = ["Toutes", ...Object.values(Priority)];

export default function TicketTable({
  isAdmin = false,
  clientId,
  technicianId,
}: {
  isAdmin?: boolean;
  clientId?: string;
  technicianId?: string;
}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const { push } = useRouter();

  useEffect(() => {
    async function loadTickets() {
      try {
        const response = await fetch(
          `/api/tickets?${clientId ? `clientId=${clientId}` : ""}${technicianId ? `&technicianId=${technicianId}` : ""}`,
        );
        const data = await response.json();
        console.log("data:", data);
        if (!response.ok) {
          throw new Error(data.message ?? `Erreur ${response.status}`);
        }

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
  }, [clientId, technicianId]);

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
                  .getColumn("status")
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
        <Button
          className="toggle-button"
          variant="outline"
          color="green"
          onClick={() => {
            table
              .getColumn("assigned_to_name")
              ?.setFilterValue((old: boolean) => !old);
          }}
          text="Non assigné"
        >
          {table.getColumn("assigned_to_name")?.getFilterValue() ? (
            <FaToggleOn />
          ) : (
            <FaToggleOff />
          )}
        </Button>
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
                onClick={() =>
                  push(
                    `/${isAdmin ? "admin" : "client"}/tickets/${row.original.id}`,
                  )
                }
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
