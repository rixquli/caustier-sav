"use client";

import Button from "@/components/Button";
import Modal, {
  ModalBody,
  ModalCloseBtn,
  ModalFooter,
  ModalHeader,
  ModalTextInput,
} from "@/components/Modal/Modal";
import Separator from "@/components/Separator";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { BiPlus } from "react-icons/bi";

type FormData = {
  title: string;
  description: string;
};

export function CreateTicketForm({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, reset } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      reset();
      onClose();
    }

    const result = await response.json();
    console.log(result);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ModalHeader>
        <h1>Créer un ticket</h1>
        <ModalCloseBtn onClick={onClose} />
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
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="submit">Envoyer</Button>
      </ModalFooter>
    </form>
  );
}

export default function NewTicketButton() {
  const [isOpen, setIsOpen] = useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <>
      <Button type="button" text="Nouveau ticket" onClick={openModal}>
        <BiPlus size={30} />
      </Button>
      <Modal isOpen={isOpen} onClose={closeModal}>
        <CreateTicketForm onClose={closeModal} />
      </Modal>
    </>
  );
}
