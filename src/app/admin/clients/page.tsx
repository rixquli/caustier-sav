"use client";

import PageHeader from "@/components/page/PageHeader";
import Card from "@/components/Card";
import Separator from "@/components/Separator";

import { MdOutlineRecordVoiceOver } from "react-icons/md";
import { GrDocumentConfig } from "react-icons/gr";
import Button from "@/components/Button";
import { BiPlus } from "react-icons/bi";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Modal, {
  ModalCloseBtn,
  ModalBody,
  ModalHeader,
  ModalTextInput,
  ModalFooter,
} from "@/components/Modal/Modal";
import { User } from "@/types/user";

export default function ClientList() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<User[]>([]);
  const { push } = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch(`/api/users?is_admin=false`).then((res) => {
      res.json().then((data) => {
        setClients(data);
      });
    });
  }, []);

  return (
    <>
      <PageHeader title="Client" description="Voici la liste des clients">
        <Button text="Nouveau client" onClick={() => setIsOpen(true)}>
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
              el.adresse.toLowerCase().includes(globalFilter.toLowerCase()),
          )
          .map((client) => {
            const desc = (
              <>
                Ville: {client.ville}, {client.code_postal}
                <br />
                Adresse: {client.adresse}
              </>
            );

            return (
              <Card
                key={client.id}
                title={client.name}
                desc={desc}
                badgeText={{
                  reversed: false,
                  text: "Client",
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

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalHeader>
          <h1>Test</h1>
          <ModalCloseBtn onClick={() => setIsOpen(false)} />
        </ModalHeader>

        <Separator />

        <ModalBody>
          <div className="form-parent">
            <ModalTextInput id="client-name" placeholder="Nom">
              Nom du client
            </ModalTextInput>
            <ModalTextInput id="client-prenom" placeholder="Prénom">
              Prénom du client
            </ModalTextInput>
            <ModalTextInput id="client-entreprise" placeholder="Entreprise">
              Entreprise du client
            </ModalTextInput>
          </div>
        </ModalBody>

        <ModalFooter></ModalFooter>
      </Modal>
    </>
  );
}
