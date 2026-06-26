"use client";
import { AiOutlineSearch } from "react-icons/ai";
import { MiniButton } from "./MiniButton";
import {
  BiArrowFromTop,
  BiArrowToTop,
  BiMicrophone,
  BiPlus,
} from "react-icons/bi";
import { BsArrowUp } from "react-icons/bs";
import Button from "./Button";
import { CgAttachment } from "react-icons/cg";
import { useState } from "react";

function CatBubble({ received = false }: { received?: boolean }) {
  return (
    <div
      className={`chat-bubble ${received ? "chat-bubble-received" : "chat-bubble-sent"}`}
    >
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Officiis, eum
      vitae. Illo fugiat assumenda sapiente omnis dolor esse maiores, ipsa culpa
      laborum, explicabo est, possimus labore porro voluptates. Adipisci,
      soluta.
    </div>
  );
}

export function Chat({ className }: { className: string }) {
  const [isOpenActionMenu, setIsOpenActionMenu] = useState(false);
  return (
    <div className={`chat shadow ${className}`}>
      <div className="chat-body">
        <CatBubble />
        <CatBubble received />
        <CatBubble />
      </div>
      <div className="chat-footer">
        <MiniButton
          className="relative"
          color="#00A33A"
          icon={<BiPlus />}
          onClick={() => setIsOpenActionMenu((pre) => !pre)}
        >
          {isOpenActionMenu && (
            <div className="chat-action-menu">
              <Button text="Audio">
                <BiMicrophone />
              </Button>
              <Button text="Pièce jointe">
                <CgAttachment />
              </Button>
            </div>
          )}
        </MiniButton>
        <label className="search-bar">
          <input type="text" placeholder="Envoyer un message..." />
        </label>
        <MiniButton color="#00A33A" icon={<BsArrowUp />} />
      </div>
    </div>
  );
}
