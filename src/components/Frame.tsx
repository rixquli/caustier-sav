"use client";
import React, { MouseEventHandler } from "react";
import { AiOutlineClose } from "react-icons/ai";

type SectionProps = {
  children?: React.ReactNode;
  className?: string;
};

export function Frame({ children, className = "" }: SectionProps) {
  return <div className={`shadow frame ${className}`}>{children}</div>;
}

export function FrameInfo({ children, className = "" }: SectionProps) {
  return <div className={`frame-info ${className}`}>{children}</div>;
}

export function FrameHeader({
  frameHeaderText,
  children,
  className = "",
}: SectionProps & { frameHeaderText: string }) {
  return (
    <div className="frame-header">
      <h2 className={`${className}`}>{frameHeaderText}</h2>
      {children}
    </div>
  );
}

export function FrameCloseBtn({
  onClick,
  className = "",
}: SectionProps & { onClick: MouseEventHandler }) {
  return (
    <button onClick={onClick} className={"frame-close-btn " + className}>
      <AiOutlineClose className={``} size={35} />
    </button>
  );
}

export function FrameBody({ children, className = "" }: SectionProps) {
  return <div className={`frame-body ${className}`}>{children}</div>;
}

export function FrameFooter({ children, className = "" }: SectionProps) {
  return <div className={`frame-footer ${className}`}>{children}</div>;
}
