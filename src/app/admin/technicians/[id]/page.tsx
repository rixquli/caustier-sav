"use client";
import PageHeader from "@/components/page/PageHeader";
import { BackButton } from "@/components/BackButton";
import Button from "@/components/Button";
import Separator from "@/components/Separator";
import { Frame, FrameHeader, FrameInfo, FrameFooter } from "@/components/Frame";

import { HiOutlineTrash, HiPencilSquare } from "react-icons/hi2";
import { IoLockClosedSharp } from "react-icons/io5";

import "./page.css";
import { BiPlus } from "react-icons/bi";
import { MdOutlineFactory } from "react-icons/md";
import { SetStateAction, Dispatch, useEffect, useState } from "react";
import { Specialite, Specialites, User } from "@/types/user";
import { useParams, useRouter } from "next/navigation";
import { Ticket } from "@/types/ticket";
import Modal, {
  ModalBody,
  ModalTextInput,
  ModalCloseBtn,
  ModalFooter,
  ModalHeader,
  ModalSelectInput,
} from "@/components/Modal/Modal";
import { useForm } from "react-hook-form";
import TicketTable from "@/components/client/TicketTable";
import { Machine } from "@/types/machine";
import { CreateMachine } from "@/components/Modal/CreateMachine";

type FormData = {
  name?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  code_postal?: string;
  telephone?: string;
  email?: string;
  note?: string;
  specialite?: Specialite;
};
export function UpdateClientForm({
  onClose,
  client,
  setClient,
}: {
  onClose: () => void;
  client: User | null;
  setClient: Dispatch<SetStateAction<User | null>>;
}) {
  const { register, handleSubmit, reset } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    if (!client) return;

    const response = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...client, ...data }),
    });

    if (response.ok) {
      const newClient: User = { ...client, ...data };
      reset();
      onClose();
      setClient(newClient);
    }

    const result = await response?.json().catch((error) => {
      console.error(error);
      return null;
    });
    if (result) {
      console.log(result);
    }
  }

  useEffect(() => {
    if (client) {
      reset(client);
    }
  }, [client, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ModalHeader>
        <h1>Modifier un client</h1>
        <ModalCloseBtn onClick={onClose} />
      </ModalHeader>
      <Separator />
      <ModalBody>
        <div className="form-parent">
          <ModalTextInput
            id="client-name"
            placeholder="Nom"
            register={register("name", { required: false })}
          >
            Nouveau nom du client
          </ModalTextInput>
          <ModalTextInput
            id="client-adresse"
            placeholder="Adresse"
            variant="description"
            register={register("adresse", { required: false })}
          >
            Nouvelle adresse du client
          </ModalTextInput>
          <ModalTextInput
            id="client-ville"
            placeholder="Ville"
            register={register("ville", { required: false })}
          >
            Nouvelle ville du client
          </ModalTextInput>
          <ModalTextInput
            id="client-pays"
            placeholder="Pays"
            register={register("pays", { required: false })}
          >
            Nouvelle pays du client
          </ModalTextInput>
          <ModalTextInput
            id="client-code_postal"
            placeholder="Code postal"
            register={register("code_postal", { required: false })}
          >
            Nouvelle code postal du client
          </ModalTextInput>
          <ModalTextInput
            id="client-telephone"
            placeholder="Téléphone"
            register={register("telephone", { required: false })}
          >
            Nouvelle téléphone du client
          </ModalTextInput>
          <ModalTextInput
            id="client-email"
            placeholder="Email"
            register={register("email", { required: false })}
          >
            Nouvelle email du client
          </ModalTextInput>
          {client?.is_admin && (
            <ModalSelectInput
              id="client-specialite"
              optionList={Object.values(Specialites).map((specialite) => ({
                text: specialite,
                value: specialite,
              }))}
              placeholder="Specialite"
              register={register("specialite", { required: false })}
            >
              Nouvelle specialite du client
            </ModalSelectInput>
          )}
          <ModalTextInput
            id="client-note"
            placeholder="Note"
            variant="description"
            register={register("note", { required: false })}
          >
            Nouvelle note du client
          </ModalTextInput>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="submit">Envoyer</Button>
      </ModalFooter>
    </form>
  );
}

export default function ClientDetail() {
  const params = useParams<{ id: string }>();
  const [client, setClient] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isOpenMachine, setIsOpenMachine] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetch(`/api/users/${params.id}`).then((res) => {
      res.json().then((data) => {
        setClient(data);
        if (data.id) {
          fetch(`/api/machines?assigned_to=${data.id}`).then((res) => {
            res.json().then((data) => {
              setMachines(data);
            });
          });
        }
      });
    });
  }, [params.id]);
  return (
    <>
      <PageHeader>
        <BackButton />
        <div className="client-detail-actions">
          <Button text="Supprimer" color="red">
            <HiOutlineTrash />
          </Button>
          {/* <Button text="Archiver" color="yellow">
            <IoLockClosedSharp />
          </Button> */}
          <Button text="Modifier" color="green" onClick={() => setIsOpen(true)}>
            <HiPencilSquare />
          </Button>
        </div>
      </PageHeader>

      <section className="page-container client-detail-container">
        <div className="client-detail-side">
          <Frame className="client-info-container">
            <FrameHeader
              frameHeaderText={client?.name ?? "Loading..."}
              className="frame-header-text"
            />
            <Separator />
            <FrameInfo>
              <div className="frame-line-detail-info">
                {client && (
                  <>
                    <div>
                      <span>Adresse: </span>
                      <span>{client.adresse}</span>
                    </div>
                    <div>
                      <span>Ville: </span>
                      <span>{client.ville}</span>
                    </div>
                    <div>
                      <span>Patron: </span>
                      <span>{client.name}</span>
                    </div>
                    <div>
                      <span>Adresse email: </span>
                      <span>{client.email}</span>
                    </div>
                    <div>
                      <span>Téléphone: </span>
                      <span>{client.telephone}</span>
                    </div>
                    <div>
                      <span>Specialite: </span>
                      <span>{client.specialite}</span>
                    </div>
                  </>
                )}
              </div>
            </FrameInfo>
          </Frame>
        </div>
      </section>
      <section className="page-container">
        <h4>Tickets assignés à ce technicien</h4>
        <TicketTable technicianId={params.id?.toString() ?? ""} isAdmin />
      </section>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <UpdateClientForm
          client={client}
          setClient={setClient}
          onClose={() => setIsOpen(false)}
        />
      </Modal>
      <CreateMachine
        isOpen={isOpenMachine}
        setIsOpen={setIsOpenMachine}
        clientId={client?.id}
      />
    </>
  );
}
