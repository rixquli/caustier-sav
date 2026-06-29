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

export default function faqDetail() {
  return (
    <>
      <PageHeader>
        <BackButton />
      </PageHeader>
      <section className="page-container faq-detail-container">
        <div className="faq-detail-side">
          <Frame className="">
            <FrameHeader
              frameHeaderText="Probleme pesée"
              className="frame-header-text"
            ></FrameHeader>
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
        </div>
      </section>
    </>
  );
}
