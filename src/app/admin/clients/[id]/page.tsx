import PageHeader from "@/components/page/PageHeader";
import { BackButton } from "@/components/BackButton";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Separator from "@/components/Separator";
import {
  Frame,
  FrameHeader,
  FrameInfo,
  FrameBody,
  FrameFooter,
} from "@/components/Frame";

import { HiOutlineTrash, HiPencilSquare } from "react-icons/hi2";
import { IoLockClosedSharp } from "react-icons/io5";

import "./page.css";
import { BiPlus } from "react-icons/bi";
import { BsFileEarmarkPerson } from "react-icons/bs";
import { MdOutlineFactory } from "react-icons/md";

const clientInfo = [
  { text: "Adresse", value: "Adresse client" },
  { text: "Pays", value: "France" },
  { text: "Patron", value: "Patron du client" },
  { text: "Adresse email", value: "client@gmail.com" },
  { text: "Téléphone", value: "01 02 03 04 05" },
  { text: "Notes", value: "ddd" },
];

const machineInfos = [
  [
    { text: "Type", value: "Caustier" },
    { text: "Nombre de ligne", value: 7 },
    { text: "Produit", value: "Oignons" },
    { text: "Modèle", value: "CAL-200" },
    { text: "Version logiciel", value: "v1.21.2" },
    { text: "État", value: "Bon état" },
    { text: "Notes", value: "Bon état général, maintenance OK" },
  ],
  [
    { text: "Type", value: "Caustier" },
    { text: "Nombre de ligne", value: 7 },
    { text: "Produit", value: "Oignons" },
    { text: "Modèle", value: "CAL-200" },
    { text: "Version logiciel", value: "v1.21.2" },
    { text: "État", value: "Bon état" },
    { text: "Notes", value: "Bon état général, maintenance OK" },
  ],
];

export default function clientDetai() {
  return (
    <>
      <PageHeader>
        <BackButton />
        <div className="client-detail-actions">
          <Button text="Supprimer" color="red">
            <HiOutlineTrash />
          </Button>
          <Button text="Archiver" color="yellow">
            <IoLockClosedSharp />
          </Button>
          <Button text="Modifier" color="green">
            <HiPencilSquare />
          </Button>
        </div>
      </PageHeader>

      <section className="page-container client-detail-container">
        <div className="client-detail-side">
          <Frame className="client-info-container">
            <FrameHeader
              frameHeaderText="NOM CLIENT"
              className="frame-header-text"
            />
            <Separator />
            <FrameInfo>
              <div className="frame-line-detail-info">
                {clientInfo.map((el, i) => (
                  <div key={`client-info-${i}`}>
                    <span>{el.text}: </span>
                    <span>{el.value}</span>
                  </div>
                ))}
              </div>
            </FrameInfo>
          </Frame>
        </div>

        <div className="client-detail-side">
          <div className="client-detail-machine-header">
            <PageHeader title="Machines">
              <Button variant="outline" text="Ajouter Machine">
                {" "}
                <BiPlus />
              </Button>
            </PageHeader>
          </div>
          <div className="client-detail-machine-list">
            {machineInfos.map((machineInfo, i) => (
              <Frame className="" key={`machine-${i}`}>
                <FrameHeader
                  frameHeaderText="NOM Machine"
                  className="frame-header-text"
                />
                <Separator />
                <FrameInfo>
                  <div className="frame-line-detail-info">
                    {machineInfo.map((el, i) => (
                      <div key={`client-info-${i}`}>
                        <span>{el.text}: </span>
                        <span>{el.value}</span>
                      </div>
                    ))}
                  </div>
                </FrameInfo>
                <Separator />
                <FrameFooter>
                  <Button variant="outline" text="Voir fiche machine">
                    <MdOutlineFactory />
                  </Button>
                </FrameFooter>
              </Frame>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
