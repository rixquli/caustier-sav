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
import { useState } from "react";
import { BsToggleOn } from "react-icons/bs";
const data: Ticket[] = [
  {
    id: "1",
    title: "Bug login page",
    description:
      "Les utilisateurs ne peuvent pas se connecter avec leur email.",
    assignTo: "Alice Martin",
    creationDate: new Date("2024-01-15"),
    statut: "Ouverte",
    priority: "Haute",
  },
  {
    id: "2",
    title: "Amélioration dashboard",
    description:
      "Ajouter des graphiques de performance sur le tableau de bord.",
    assignTo: "Bob Dupont",
    creationDate: new Date("2024-01-18"),
    statut: "En cours",
    priority: "Moyenne",
  },
  {
    id: "3",
    title: "Erreur export PDF",
    description: "L'export PDF plante sur les rapports de plus de 50 pages.",
    assignTo: "Claire Lefebvre",
    creationDate: new Date("2024-01-20"),
    statut: "Ouverte",
    priority: "Haute",
  },
  {
    id: "4",
    title: "Mise à jour dépendances",
    description: "Mettre à jour les packages npm obsolètes.",
    assignTo: "David Bernard",
    creationDate: new Date("2024-01-22"),
    statut: "Fermé",
    priority: "Basse",
  },
  {
    id: "5",
    title: "Page 404 manquante",
    description: "Créer une page d'erreur 404 personnalisée.",
    assignTo: "Alice Martin",
    creationDate: new Date("2024-01-25"),
    statut: "En cours",
    priority: "Moyenne",
  },
  {
    id: "6",
    title: "Fuite mémoire API",
    description:
      "L'API consomme de plus en plus de mémoire après 24h d'uptime.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-01-28"),
    statut: "Ouverte",
    priority: "Critique",
  },
  {
    id: "7",
    title: "Traduction manquante",
    description: "Plusieurs labels ne sont pas traduits en anglais.",
    assignTo: "Bob Dupont",
    creationDate: new Date("2024-02-01"),
    statut: "Fermé",
    priority: "Basse",
  },
  {
    id: "8",
    title: "Timeout requêtes lentes",
    description:
      "Les requêtes sur la liste des commandes dépassent le timeout.",
    assignTo: "Claire Lefebvre",
    creationDate: new Date("2024-02-03"),
    statut: "En cours",
    priority: "Haute",
  },
  {
    id: "9",
    title: "Formulaire d'inscription cassé",
    description:
      "Le bouton soumettre est désactivé même avec les champs remplis.",
    assignTo: "David Bernard",
    creationDate: new Date("2024-02-05"),
    statut: "Ouverte",
    priority: "Haute",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
  {
    id: "10",
    title: "Optimisation images",
    description:
      "Compresser les assets images pour améliorer le temps de chargement.",
    assignTo: "Eve Rousseau",
    creationDate: new Date("2024-02-08"),
    statut: "Fermé",
    priority: "Moyenne",
  },
];

const columns = [
  { accessorKey: "id", header: "Id" },
  { accessorKey: "title", header: "Titre" },
  { accessorKey: "assignTo", header: "Assigné à" },
  { accessorKey: "priority", header: "Priorité" },
  { accessorKey: "statut", header: "Statut" },
];

const STATUTS = ["Tous", "Ouverte", "En cours", "Fermé"];
const PRIORITIES = ["Toutes", "Basse", "Moyenne", "Haute", "Critique"];
// const TYPES = ["Tous", ];

export default function TicketTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const { push } = useRouter();
  const pathname = usePathname();

  const table = useReactTable({
    data,
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

  console.log(columnFilters);

  return (
    <div>
      {/* Barre de recherche globale */}
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
                    e.target.value === "Toutes" ? undefined : e.target.value,
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

      <table className="tickets-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {/* Bouton de tri */}
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
    </div>
  );
}
