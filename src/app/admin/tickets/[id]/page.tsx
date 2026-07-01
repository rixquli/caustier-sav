"use client";

import "./page.css";
import { BackButton } from "@/components/BackButton";
import Separator from "@/components/Separator";
import {
  Frame,
  FrameBody,
  FrameFooter,
  FrameHeader,
  FrameInfo,
} from "@/components/Frame";
import PageHeader from "@/components/page/PageHeader";
import Badge from "@/components/Badge";
import { GrStatusGoodSmall } from "react-icons/gr";
import { MiniButton } from "@/components/MiniButton";
import {
  MdDangerous,
  MdOutlineAssignmentInd,
  MdOutlineFactory,
} from "react-icons/md";
import { HiLockClosed } from "react-icons/hi";
import { BiSolidTrash } from "react-icons/bi";
import { BsCircleFill, BsPencilSquare } from "react-icons/bs";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Priority, Status, Ticket } from "@/types/ticket";
import { useParams, useRouter } from "next/navigation";
import { IoWarning, IoPerson } from "react-icons/io5";
import { CreateTicketForm } from "@/components/client/NewTicketButton";
import { CiCircleAlert } from "react-icons/ci";

import Modal, {
  ModalBody,
  ModalCloseBtn,
  ModalFooter,
  ModalHeader,
  ModalSelectInput,
  ModalTextInput,
} from "@/components/Modal/Modal";
import Button from "@/components/Button";
import { useForm } from "react-hook-form";
import { User } from "@/types/user";

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
  title?: string;
  description?: string;
  status?: Status;
  priority?: Priority;
};

export function UpdateTicketForm({
  onClose,
  ticket,
  setTicket,
}: {
  onClose: () => void;
  ticket: Ticket | null;
  setTicket: Dispatch<SetStateAction<Ticket | null>>;
}) {
  const { register, handleSubmit, reset } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    if (!ticket) return;

    const response = await fetch("/api/tickets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ticket, ...data }),
    });

    if (response.ok) {
      const newTicket: Ticket = { ...ticket, ...data };
      reset();
      onClose();
      setTicket(newTicket);
    }

    const result = await response.json();
    console.log(result);
  }

  useEffect(() => {
    if (ticket) {
      reset(ticket);
    }
  }, [ticket, reset]);

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
            register={register("title", { required: false })}
          >
            Nouveau titre du ticket
          </ModalTextInput>
          <ModalTextInput
            id="ticket-description"
            placeholder="Description"
            variant="description"
            register={register("description", { required: false })}
          >
            Nouvelle Description du ticket
          </ModalTextInput>
          <ModalSelectInput
            id="ticket-status"
            placeholder="Statut"
            register={register("status", { required: false })}
            optionList={Object.values(Status).map((status) => ({
              text: status,
              value: status,
            }))}
          >
            Statut du ticket
          </ModalSelectInput>
          <ModalSelectInput
            id="ticket-priority"
            placeholder="Priorité"
            register={register("priority", { required: false })}
            optionList={Object.keys(priorityConfig).map((priority) => ({
              text: priority,
              value: priority,
            }))}
          >
            Priorité du ticket
          </ModalSelectInput>
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
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [admins, setAdmins] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/tickets/${params.id}`).then((res) => {
      res.json().then((data) => {
        setTicket(data);
        if (data.created_by) {
          fetch(`/api/users/${data.created_by}`).then((res) => {
            res.json().then((data) => {
              setUser(data);
            });
          });
        }
      });
    });
    fetch(`/api/users?is_admin=true`).then((res) => {
      res.json().then((data) => {
        setAdmins(data);
      });
    });
  }, [params.id]);

  const changeAssignee = async (userId: number) => {
    if (!ticket) return;
    const response = await fetch(`/api/tickets`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ticket, assigned_to: userId }),
    });
    if (response.ok) {
      setTicket({ ...ticket, assigned_to: userId });
    }
  };

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
                >
                  <div className="tickets-action-rapide">
                    {/* <MiniButton
                      icon={<MdOutlineAssignmentInd />}
                      color="#0DA33A"
                    /> */}
                    {/* <MiniButton icon={<HiLockClosed />} color="#DDD017" /> */}
                    <MiniButton icon={<BiSolidTrash />} color="#FF0000" />
                    <MiniButton
                      icon={<BsPencilSquare />}
                      color="#003300"
                      onClick={() => setIsOpen(true)}
                    />
                  </div>
                </FrameHeader>
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
                        icon={priorityConfig[ticket.priority]?.icon}
                        iconColor={priorityConfig[ticket.priority]?.color}
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
            <div className="ticket-detail-footer">
              <div className="ticket-detail-suivis">
                <div className="suivis-header">
                  <h2>Suivis</h2>
                  <Separator />
                </div>

                <div className="suivis-content">
                  <div className="suivis-item">
                    <div className="suivis-icon">
                      <CiCircleAlert />
                    </div>
                    <div className="suivis-text">
                      <h3>Jeremy a changé le nom du ticket par Test.</h3>
                      <p>Il y a 3min.</p>
                    </div>
                  </div>

                  <div className="suivis-item">
                    <div className="suivis-icon">
                      <CiCircleAlert />
                    </div>
                    <div className="suivis-text">
                      <h3>Jeremy a changé le nom du ticket par Test.</h3>
                      <p>Il y a 3min.</p>
                    </div>
                  </div>

                  <div className="suivis-item">
                    <div className="suivis-icon">
                      <CiCircleAlert />
                    </div>
                    <div className="suivis-text">
                      <h3>Jeremy a changé le nom du ticket par Test.</h3>
                      <p>Il y a 3min.</p>
                    </div>
                  </div>

                  <div className="suivis-item">
                    <div className="suivis-icon">
                      <CiCircleAlert />
                    </div>
                    <div className="suivis-text">
                      <h3>Jeremy a changé le nom du ticket par Test.</h3>
                      <p>Il y a 3min.</p>
                    </div>
                  </div>

                  <div className="suivis-item">
                    <div className="suivis-icon">
                      <CiCircleAlert />
                    </div>
                    <div className="suivis-text">
                      <h3>Jeremy a changé le nom du ticket par Test.</h3>
                      <p>Il y a 3min.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ticket-detail-info">
                <div className="ticket-info-header">
                  <div className="assign-to-container">
                    <div className="assign-to-header">
                      <h2>Assigné a</h2>
                      <Separator />
                    </div>
                    <select
                      name=""
                      id=""
                      className="select-assign"
                      onChange={(e) => changeAssignee(Number(e.target.value))}
                      defaultValue={
                        ticket?.assigned_to ? ticket.assigned_to : ""
                      }
                    >
                      <option value={""}>Aucun</option>
                      {admins.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="ticket-info-footer">
                  {user ? (
                    <>
                      <Frame className="">
                        <FrameHeader
                          frameHeaderText="Informations Client"
                          className="frame-header-text"
                        />
                        <Separator />
                        <FrameInfo>
                          <div className="frame-line-detail-info">
                            {user && (
                              <>
                                <div>
                                  <span>Nom: </span>
                                  <span>{user.name}</span>
                                </div>
                                <div>
                                  <span>Adresse: </span>
                                  <span>{user.adresse}</span>
                                </div>
                                <div>
                                  <span>Ville: </span>
                                  <span>{user.ville}</span>
                                </div>
                                <div>
                                  <span>Pays: </span>
                                  <span>{user.pays}</span>
                                </div>
                                <div>
                                  <span>Code postal: </span>
                                  <span>{user.code_postal}</span>
                                </div>
                                <div>
                                  <span>Téléphone: </span>
                                  <span>{user.telephone}</span>
                                </div>
                                <div>
                                  <span>Email: </span>
                                  <span>{user.email}</span>
                                </div>
                                <div>
                                  <span>Notes: </span>
                                  <span>{user.note}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </FrameInfo>
                        <Separator />
                        <FrameFooter>
                          <Button
                            variant="outline"
                            text="Voir fiche client"
                            onClick={() =>
                              router.push(`/admin/clients/${user.id}`)
                            }
                          >
                            <IoPerson />
                          </Button>
                        </FrameFooter>
                      </Frame>
                    </>
                  ) : (
                    <div>Loading...</div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div>LOADING...</div>
        )}
      </section>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <UpdateTicketForm
          ticket={ticket}
          setTicket={setTicket}
          onClose={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
