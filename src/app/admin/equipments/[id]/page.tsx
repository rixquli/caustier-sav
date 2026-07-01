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
import { useState } from "react";
import { Machine } from "@/types/machine";
import { useEffect } from "react";

export default function MachineDetail() {
  const params = useParams<{ id: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);

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
                <MiniButton icon={<BsPencilSquare />} color="#003300" />
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
    </>
  );
}
