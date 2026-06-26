"use client";
import PageHeader from "@/components/page/PageHeader";
import Card from "@/components/Card";

import { MdOutlineRecordVoiceOver } from "react-icons/md";
import { GrDocumentConfig } from "react-icons/gr";
import Button from "@/components/Button";
import { BiPlus } from "react-icons/bi";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

const clients = [
  {
    id: "1",
    name: "TechSolutions SAS",
    ville: "Paris",
    codePostal: "75008",
    patron: "Jean Dupont",
  },
  {
    id: "2",
    name: "Boulangerie Martin",
    ville: "Lyon",
    codePostal: "69002",
    patron: "Marie Martin",
  },
  {
    id: "3",
    name: "Cabinet Lefebvre",
    ville: "Bordeaux",
    codePostal: "33000",
    patron: "Pierre Lefebvre",
  },
  {
    id: "4",
    name: "Garage Renault Pro",
    ville: "Marseille",
    codePostal: "13005",
    patron: "Sophie Bernard",
  },
  {
    id: "5",
    name: "Studio Créatif",
    ville: "Nantes",
    codePostal: "44000",
    patron: "Lucas Moreau",
  },
  {
    id: "6",
    name: "Immobilier Côte d'Azur",
    ville: "Nice",
    codePostal: "06000",
    patron: "Isabelle Petit",
  },
  {
    id: "7",
    name: "Restaurant Le Gourmet",
    ville: "Strasbourg",
    codePostal: "67000",
    patron: "Antoine Roux",
  },
  {
    id: "8",
    name: "Pharmacie Centrale",
    ville: "Toulouse",
    codePostal: "31000",
    patron: "Camille Blanc",
  },
];

export default function ClientList() {
  const [globalFilter, setGlobalFilter] = useState("");
  const { push } = useRouter();
  const pathname = usePathname();

  return (
    <>
      <PageHeader title="Client" description="Voici la liste des clients">
        <Button text="Nouveau client">
          <BiPlus size={30} />
        </Button>
      </PageHeader>

      <div className="vos-tickets-header">
        <input
          className="input-bar"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Rechercher..."
        />
      </div>

      <section className="page-list-container">
        {clients
          .filter(
            (el) =>
              globalFilter == "" ||
              el.ville.toLowerCase().includes(globalFilter.toLowerCase()) ||
              el.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
              el.patron.toLowerCase().includes(globalFilter.toLowerCase()),
          )
          .map((client) => {
            const desc = (
              <>
                Ville: {client.ville}, {client.codePostal}
                <br />
                Patron: {client.patron}
              </>
            );

            return (
              <Card
                key={client.id}
                title={client.name}
                desc={desc}
                badgeText={{
                  reversed: false,
                  text: "Patron",
                  icon: <MdOutlineRecordVoiceOver />,
                  iconColor: "#000000",
                }}
                cardBtn={{
                  textCard: "Voir la fiche",
                  iconCard: <GrDocumentConfig />,
                  onClick: () => push(`${pathname}/${client.id}`),
                }}
              />
            );
          })}
      </section>
    </>
  );
}
