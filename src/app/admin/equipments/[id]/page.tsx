"use client";

import {
  Frame,
  FrameInfo,
  FrameHeader,
  FrameCloseBtn,
  FrameBody,
  FrameFooter,
} from "@/components/Frame";

import PageHeader from "@/components/page/PageHeader";
import { BackButton } from "@/components/BackButton";
import Separator from "@/components/Separator";
import Button from "@/components/Button";
import { BsFileEarmarkPerson, BsPencilSquare } from "react-icons/bs";
import Badge from "@/components/Badge";
import { MiniButton } from "@/components/MiniButton";
import { MdOutlineAssignmentInd } from "react-icons/md";
import { HiLockClosed } from "react-icons/hi";
import { BiSolidTrash } from "react-icons/bi";
import { GrStatusGoodSmall } from "react-icons/gr";
import { FcHighPriority } from "react-icons/fc";
import "./page.css";
import { useParams } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import { Machine } from "@/types/machine";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal, {
  ModalBody,
  ModalCloseBtn,
  ModalFooter,
  ModalHeader,
  ModalTextInput,
} from "@/components/Modal/Modal";

type FormData = {
  name?: string;
  type?: string;
  number_ligne?: string;
  product?: string;
  version?: string;
  tel_pilote?: string;
  tel_technician?: string;
  note?: string;
};
export function UpdateMachineForm({
  onClose,
  machine,
  setMachine,
}: {
  onClose: () => void;
  machine: Machine | null;
  setMachine: Dispatch<SetStateAction<Machine | null>>;
}) {
  const { register, handleSubmit, reset } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    if (!machine) return;

    const response = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...machine, ...data }),
    });

    if (response.ok) {
      const newMachine: Machine = { ...machine, ...data };
      reset();
      onClose();
      setMachine(newMachine);
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
    if (machine) {
      reset(machine);
    }
  }, [machine, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ModalHeader>
        <h1>Modifier une machine</h1>
        <ModalCloseBtn onClick={onClose} />
      </ModalHeader>
      <Separator />
      <ModalBody>
        <div className="form-parent">
          <ModalTextInput
            id="machine-name"
            placeholder="Nom"
            register={register("name", { required: false })}
          >
            Nouveau nom de la machine
          </ModalTextInput>
          <ModalTextInput
            id="machine-type"
            placeholder="Type"
            register={register("type", { required: false })}
          >
            Nouveau type de la machine
          </ModalTextInput>
          <ModalTextInput
            id="machine-number-ligne"
            placeholder="Nombre de ligne"
            register={register("number_ligne", { required: false })}
          >
            Nouveau nombre de ligne de la machine
          </ModalTextInput>
          <ModalTextInput
            id="machine-product"
            placeholder="Produit"
            register={register("product", { required: false })}
          >
            Nouveau produit de la machine
          </ModalTextInput>
          <ModalTextInput
            id="machine-version"
            placeholder="Version"
            register={register("version", { required: false })}
          >
            Nouveau version de la machine
          </ModalTextInput>
          <ModalTextInput
            id="machine-tel-pilote"
            placeholder="Téléphone du pilote"
            register={register("tel_pilote", { required: false })}
          >
            Nouveau téléphone du pilote de la machine
          </ModalTextInput>
          <ModalTextInput
            id="machine-tel-technician"
            placeholder="Téléphone du technicien"
            register={register("tel_technician", { required: false })}
          >
            Nouveau téléphone du technicien de la machine
          </ModalTextInput>
          <ModalTextInput
            id="machine-note"
            placeholder="Notes"
            register={register("note", { required: false })}
          >
            Nouvelle note de la machine
          </ModalTextInput>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="submit">Envoyer</Button>
      </ModalFooter>
    </form>
  );
}

export default function MachineDetail() {
  const params = useParams<{ id: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/machines/${params.id}`).then((res) => {
      res.json().then((data) => {
        setMachine(data);
      });
    });
  }, [params.id]);
  return (
    <>
      <PageHeader>
        <BackButton />
      </PageHeader>
      <section className="page-container faq-detail-container">
        <div className="faq-detail-side">
          <Frame className="machine-info-container">
            <FrameHeader
              frameHeaderText={machine?.name ?? "Loading..."}
              className="frame-header-text"
            >
              <div className="faq-action-rapide">
                {/* <MiniButton icon={<MdOutlineAssignmentInd />} color="#0DA33A" /> */}
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
              <div className="frame-line-detail-info">
                <div>
                  <span>Type:</span>
                  <span>{machine?.type ?? ""}</span>
                </div>
                <div>
                  <span>Nombre de ligne:</span>
                  <span>{machine?.number_ligne ?? ""}</span>
                </div>
                <div>
                  <span>Produit:</span>
                  <span>{machine?.product ?? ""}</span>
                </div>
                <div>
                  <span>Version logiciel:</span>
                  <span>{machine?.version ?? ""}</span>
                </div>
                <div>
                  <span>Téléphone du pilote:</span>
                  <span>{machine?.tel_pilote ?? ""}</span>
                </div>
                <div>
                  <span>Téléphone du technicien:</span>
                  <span>{machine?.tel_technician ?? ""}</span>
                </div>
                <div>
                  <span>Notes:</span>
                  <span>{machine?.note ?? ""}</span>
                </div>
              </div>
            </FrameInfo>
          </Frame>
        </div>
      </section>
      {isOpen && (
        <Modal>
          <UpdateMachineForm
            machine={machine}
            setMachine={setMachine}
            onClose={() => setIsOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
