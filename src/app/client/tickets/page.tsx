"use client";

import Header from "@/components/Header";
import PageHeader from "@/components/page/PageHeader";
import Sidebar from "@/components/Sidebar";
import { BiPlus } from "react-icons/bi";
import Button from "@/components/Button";
import TicketTable from "@/components/client/TicketTable";
import Modal, {
  ModalBody,
  ModalCloseBtn,
  ModalFooter,
  ModalHeader,
  ModalTextInput,
} from "@/components/Modal";
import { useState } from "react";
import Separator from "@/components/Separator";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <PageHeader title="Tickets" description="Voici la liste de vos tickets">
        <Button text="Nouveau ticket" onClick={() => setIsOpen(true)}>
          <BiPlus size={30} />
        </Button>
      </PageHeader>
      <section className="page-container">
        <h4>Vos tickets</h4>
        <TicketTable />
      </section>
      <Modal isOpen={isOpen}>
        <form action="">
          <ModalHeader>
            <h1>Créer un ticket</h1>{" "}
            <ModalCloseBtn onClick={() => setIsOpen(false)} />
          </ModalHeader>
          <Separator />
          <ModalBody>
            <div className="form-parent">
              <ModalTextInput id="ticket-title" placeholder="Titre">
                Titre du ticket
              </ModalTextInput>
              <ModalTextInput
                id="ticket-description"
                placeholder="Description"
                type="description"
              >
                Description du ticket
              </ModalTextInput>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="submit">Envoyer</Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
