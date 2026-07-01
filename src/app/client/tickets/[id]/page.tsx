"use client";

import "./page.css";
import { BackButton } from "@/components/BackButton";
import Separator from "@/components/Separator";
import { Frame, FrameBody, FrameHeader, FrameInfo } from "@/components/Frame";
import PageHeader from "@/components/page/PageHeader";
import Badge from "@/components/Badge";
import { GrStatusGoodSmall } from "react-icons/gr";
import { MiniButton } from "@/components/MiniButton";
import { MdDangerous, MdOutlineAssignmentInd } from "react-icons/md";
import { HiLockClosed } from "react-icons/hi";
import { BiSolidTrash } from "react-icons/bi";
import { BsCircleFill, BsPencilSquare } from "react-icons/bs";
import { useEffect, useState } from "react";
import { Priority, Ticket } from "@/types/ticket";
import { useParams } from "next/navigation";
import { IoWarning } from "react-icons/io5";
import { CreateTicketForm } from "@/components/client/NewTicketButton";
import { CiCircleAlert } from "react-icons/ci";

import Modal, {
  ModalBody,
  ModalCloseBtn,
  ModalFooter,
  ModalHeader,
  ModalTextInput,
} from "@/components/Modal/Modal";
import Button from "@/components/Button";
import { useForm } from "react-hook-form";

export const priorityConfig: Record<
  Priority,
  { icon: React.ReactNode; color: string }
> = {
  Basse: { icon: <BsCircleFill />, color: "#6B7280" }, // gris
  Normal: { icon: <BsCircleFill />, color: "#3B82F6" }, // bleu
  Haute: { icon: <IoWarning />, color: "#F59E0B" }, // orange
  Critique: { icon: <MdDangerous />, color: "#EF4444" }, // rouge
};

type FormData = {
  title: string;
  description: string;
};

export function UpdateTicketForm({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, reset } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    const response = await fetch("/api/tickets", {
      method: "PUT",
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
        <h1>Modifier un ticket</h1>
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

export default function TicketDetail() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/tickets/${params.id}`).then((res) => {
      res.json().then((data) => {
        setTicket(data);
      });
    });
  }, [params.id]);

  return (
    <>
      <PageHeader>
        <BackButton />
      </PageHeader>
      <section className="page-container ticket-detail-container">
        {ticket ? (
          <>
            <div className="ticket-detail-header">
              <Frame>
                <FrameHeader
                  frameHeaderText={ticket?.title ?? "loading"}
                  className="frame-header-text"
                ></FrameHeader>
                <Separator />
                <FrameInfo>
                  <div className="frame-info">
                    <div className="frame-info-el">
                      <span>Statut:</span>
                      <Badge
                        text={ticket.status}
                        icon={<GrStatusGoodSmall />}
                        iconColor={
                          ticket.status == "Ouvert" ? "#00FF00" : "#FF0000"
                        }
                      />
                    </div>
                    <div className="frame-info-el">
                      <span>Priorité:</span>
                      <Badge
                        text={ticket.priority}
                        icon={priorityConfig[ticket.priority].icon}
                        iconColor={priorityConfig[ticket.priority].color}
                      />
                    </div>
                    <div className="frame-info-el">
                      <span>Date de création:</span>
                      <span className="date-create">
                        {new Date(ticket.created_at).toLocaleDateString(
                          "fr-FR",
                        )}
                      </span>
                    </div>
                  </div>
                </FrameInfo>
                <Separator />
                <FrameBody>{ticket.description}</FrameBody>
              </Frame>
            </div>
          </>
        ) : (
          <div>LOADING...</div>
        )}
      </section>
    </>
  );
}
