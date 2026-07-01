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
  ModalSelectInput,
} from "@/components/Modal/Modal";
import { Specialite, Specialites, User } from "@/types/user";
import { useForm } from "react-hook-form";
import { FaBrain, FaMicrochip, FaQuestion, FaWrench } from "react-icons/fa";
import { FaComputer } from "react-icons/fa6";

type FormData = {
  name: string;
  prenom: string;
  specialite: Specialite;
  telephone: string;
};

const SpecialiteIcons = {
  IA: <FaBrain />,
  Electronique: <FaMicrochip />,
  Mécanique: <FaWrench />,
  Informatique: <FaComputer />,
  Autre: <FaQuestion />,
};

export default function AdminTechniciansList() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const { push } = useRouter();
  const pathname = usePathname();
  const { register, handleSubmit, reset } = useForm<FormData>();

  useEffect(() => {
    fetch(`/api/users?is_admin=true`).then((res) => {
      res.json().then((data) => {
        setTechnicians(data);
      });
    });
  }, []);

  async function onSubmit(data: FormData) {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, is_admin: true }),
    });

    if (response.ok) {
      reset();
      setIsOpen(false);
      const newTechnician: User = {
        ...data,
        is_admin: true,
        id: 0,
        email: "",
        password: "",
        adresse: "",
        ville: "",
        pays: "",
        code_postal: "",
        note: "",
      };
      setTechnicians([...technicians, newTechnician]);
    }

    const result = await response?.json().catch((error) => {
      console.error(error);
      return null;
    });
    if (result) {
      console.log(result);
    }
  }

  return (
    <>
      <PageHeader
        title="Techniciens"
        description="Voici la liste des techniciens"
      >
        <Button text="Nouveau technicien" onClick={() => setIsOpen(true)}>
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
        {technicians
          .filter(
            (el) =>
              globalFilter == "" ||
              el.ville.toLowerCase().includes(globalFilter.toLowerCase()) ||
              el.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
              el.adresse.toLowerCase().includes(globalFilter.toLowerCase()),
          )
          .map((technician) => {
            const desc = (
              <>
                Ville: {technician.ville}, {technician.code_postal}
                <br />
                Adresse: {technician.adresse}
              </>
            );

            return (
              <Card
                key={technician.id}
                title={technician.name}
                desc={desc}
                badgeText={{
                  reversed: false,
                  text: technician.specialite,
                  icon: SpecialiteIcons[technician.specialite],
                  iconColor: "#000000",
                }}
                cardBtn={{
                  textCard: "Voir la fiche",
                  iconCard: <GrDocumentConfig />,
                  onClick: () => push(`${pathname}/${technician.id}`),
                }}
              />
            );
          })}
      </section>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            <h1>Test</h1>
            <ModalCloseBtn onClick={() => setIsOpen(false)} />
          </ModalHeader>

          <Separator />

          <ModalBody>
            <div className="form-parent">
              <ModalTextInput
                id="technician-name"
                placeholder="Nom"
                register={register("name", { required: true })}
              >
                Nom du technicien
              </ModalTextInput>
              <ModalTextInput
                id="technician-prenom"
                placeholder="Prénom"
                register={register("prenom", { required: true })}
              >
                Prénom du technicien
              </ModalTextInput>
              <ModalSelectInput
                id="technician-specialite"
                optionList={Specialites.map((specialite) => ({
                  value: specialite,
                  text: specialite,
                }))}
              >
                Spécialité du technicien
              </ModalSelectInput>
              <ModalTextInput
                id="technician-telephone"
                placeholder="Téléphone"
                register={register("telephone", { required: true })}
              >
                Téléphone du technicien
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
