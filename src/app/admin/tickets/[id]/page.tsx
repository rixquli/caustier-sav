import "./page.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
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
import { FcHighPriority } from "react-icons/fc";
import { MiniButton } from "@/components/MiniButton";
import { MdOutlineAssignmentInd } from "react-icons/md";
import { HiLockClosed } from "react-icons/hi";
import { BiSolidTrash } from "react-icons/bi";
import { BsFileEarmarkPerson, BsPencilSquare } from "react-icons/bs";
import { Chat } from "@/components/Chat";
import Button from "@/components/Button";

const clientInfo = [
  { text: "Adresse", value: "Adresse client" },
  { text: "Pays", value: "France" },
  { text: "Patron", value: "Patron du client" },
  { text: "Adresse email", value: "client@gmail.com" },
  { text: "Téléphone", value: "01 02 03 04 05" },
  { text: "Notes", value: "ddd" },
];

const machineInfo = [
  { text: "Type", value: "Caustier" },
  { text: "Nombre de ligne", value: 7 },
  { text: "Produit", value: "Oignons" },
  { text: "Modèle", value: "CAL-200" },
  { text: "Version logiciel", value: "v1.21.2" },
  { text: "État", value: "Bon état" },
  { text: "Notes", value: "Bon état général, maintenance OK" },
];

const TECHNICIANS = ["Technicien1", "Technicien2"];

export default function TicketDetail() {
  return (
    <>
      <PageHeader>
        <BackButton />
      </PageHeader>
      <section className="page-container ticket-detail-container">
        <div className="ticket-detail-side">
          <Frame className="">
            <FrameHeader
              frameHeaderText="Probleme pesée"
              className="frame-header-text"
            >
              <div className="tickets-action-rapide">
                <MiniButton icon={<MdOutlineAssignmentInd />} color="#0DA33A" />
                <MiniButton icon={<HiLockClosed />} color="#DDD017" />
                <MiniButton icon={<BiSolidTrash />} color="#FF0000" />
                <MiniButton icon={<BsPencilSquare />} color="#003300" />
              </div>
            </FrameHeader>
            <Separator />
            <FrameInfo>
              <div className="frame-info">
                <div className="frame-info-el">
                  <span>Statut:</span>
                  <Badge
                    text="Ouvert"
                    icon={<GrStatusGoodSmall />}
                    iconColor={"#00FF00"}
                  />
                </div>
                <div className="frame-info-el">
                  <span>Priorité:</span>
                  <Badge
                    text="Haute"
                    icon={<FcHighPriority />}
                    iconColor={"#FF0000"}
                  />
                </div>
                <div className="frame-info-el">
                  <span>Date de création:</span>
                  <span className="date-create">23/06/2026</span>
                </div>
              </div>
            </FrameInfo>
            <Separator />
            <FrameBody>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras sit
              amet purus blandit, interdum massa nec, fringilla neque. Ut luctus
              lacus in neque facilisis, eget elementum odio elementum. Lorem
              ipsum dolor sit amet, consectetur adipiscing elit. Aliquam euismod
              arcu vel porttitor dignissim.
            </FrameBody>
          </Frame>

          <div className="ticket-detail-suivis">
            <div className="suivis-text-container">
              <div className="circle-container"></div>
            </div>
          </div>
        </div>

        <div className="ticket-detail-side">
          <Frame className="ticket-gestion">
            <FrameHeader frameHeaderText="Assigné à"></FrameHeader>
            <Separator />
            <FrameBody>
              <div className="flex-clo  ">
                <label>Technicien</label>
                <select>
                  {TECHNICIANS.map((statut) => (
                    <option key={statut} value={statut}>
                      {statut}
                    </option>
                  ))}
                </select>
              </div>
            </FrameBody>
          </Frame>
          <Frame className="">
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
            <Separator />
            <FrameFooter>
              <Button variant="outline" text="Voir fiche client">
                <BsFileEarmarkPerson />
              </Button>
            </FrameFooter>
          </Frame>
          <Frame className="">
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
              <Button variant="outline" text="Voir fiche client">
                <BsFileEarmarkPerson />
              </Button>
            </FrameFooter>
          </Frame>
        </div>
      </section>
    </>
  );
}
