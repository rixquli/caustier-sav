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
  ModalSelectInput,
  ModalTextInput,
} from "@/components/Modal/Modal";
import { useEffect, useState } from "react";
import Separator from "@/components/Separator";
import { useForm } from "react-hook-form";
import { redirect } from "next/navigation";
import { Priority, Type } from "@/types/ticket";
import { User } from "@/types/user";

type FormData = {
  title: string;
  description: string;
  created_by: number;
  type: Type;
};

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormData>();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/users?is_admin=false").then((res) => {
      res.json().then((data) => {
        setUsers(data);
      });
    });
  }, []);

  async function onSubmit(data: FormData) {
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      reset();
    }

    const result = await response.json();
    console.log(result);
  }

  return (
    <>
      <PageHeader title="Tickets" description="Voici la liste de vos tickets">
        <Button text="Nouveau ticket" onClick={() => setIsOpen(true)}>
          <BiPlus size={30} />
        </Button>
      </PageHeader>
      <section className="page-container">
        <h4>Liste des tickets</h4>
        <TicketTable isAdmin />
      </section>
      <Modal isOpen={isOpen}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            <h1>Créer un ticket</h1>{" "}
            <ModalCloseBtn onClick={() => setIsOpen(false)} />
          </ModalHeader>
          <Separator />
          <ModalBody>
            <div className="form-parent">
              <ModalTextInput
                id="ticket-title"
                placeholder="Titre"
                register={register("title", { required: true })}
              >
                Titre du ticket
              </ModalTextInput>
              <ModalTextInput
                id="ticket-description"
                placeholder="Description"
                variant="description"
                register={register("description", { required: true })}
              >
                Description du ticket
              </ModalTextInput>
              <ModalSelectInput
                id="ticket-type"
                optionList={[
                  { value: Type.Informatique, text: "Informatique" },
                  { value: Type.Electricite, text: "Electricite" },
                  { value: Type.Mecanique, text: "Mecanique" },
                  { value: Type.Autre, text: "Autre" },
                  { value: Type.Inconnu, text: "Inconnu" },
                ]}
                register={register("type", { required: true })}
              >
                Type de ticket
              </ModalSelectInput>
              <ModalSelectInput
                id="ticket-created-by"
                optionList={users.map((user) => ({
                  value: user.id.toString(),
                  text: user.name,
                }))}
                register={register("created_by", { required: true })}
              >
                Client concerné
              </ModalSelectInput>
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
