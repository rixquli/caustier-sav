"use client";

import { FcElectronics } from "react-icons/fc";
import { FaArrowRight } from "react-icons/fa";
import Card from "@/components/Card";
import { useState } from "react";
import Button from "@/components/Button";
import { GoPlus } from "react-icons/go";
import PageHeader from "@/components/page/PageHeader";

const faqs = [
  {
    id: "1",
    name: "Problème pesée",
    desc: "Débrancher le cable ici-présent et ne pas oublier de sa...",
    type: "Electronique",
    icon: <FcElectronics />,
  },
];

export default function FAQList() {
  const [globalFilter, setGlobalFilter] = useState("");

  return (
    <>
      <PageHeader title="FAQ" description="Voici la liste des FAQ">
        <Button text="Nouvelle FAQ">
          <GoPlus />
        </Button>
      </PageHeader>

      <div className="faq-list-header">
        <input
          className="input-bar"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Rechercher..."
        />
      </div>

      <div className="page-list-container">
        {faqs
          .filter(
            (el) =>
              globalFilter == "" ||
              el.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
              el.desc.toLowerCase().includes(globalFilter.toLowerCase()) ||
              el.type.toLowerCase().includes(globalFilter.toLowerCase()),
          )
          .map((faq) => {
            return (
              <Card
                key={faq.id}
                title={faq.name}
                desc={faq.desc}
                badgeText={{
                  reversed: false,
                  text: faq.type,
                  icon: faq.icon,
                  iconColor: "#ff0000",
                }}
                cardBtn={{
                  textCard: "En savoir plus",
                  iconCard: <FaArrowRight />,
                }}
              ></Card>
            );
          })}
      </div>
    </>
  );
}
