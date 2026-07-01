"use client";
import React, { MouseEventHandler, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { AiOutlineClose } from "react-icons/ai";

type ModalProps = {
  children: React.ReactNode;
  isOpen?: boolean;
  noOverlay?: boolean;
  onClose?: () => void;
  className?: string;
};

type SectionProps = {
  children?: React.ReactNode;
  className?: string;
};
type InputSectionProps = {
  children: React.ReactNode;
  id: string;
  className?: string;
  placeholder?: string;
};

function Modal({
  children,
  isOpen = true,
  noOverlay = false,
  onClose,
  className = "",
}: ModalProps) {
  const canCloseOverlayRef = useRef(true);

  useEffect(() => {
    if (!isOpen) {
      canCloseOverlayRef.current = true;
      return;
    }

    canCloseOverlayRef.current = false;
    const timer = window.setTimeout(() => {
      canCloseOverlayRef.current = true;
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div
      className={`modal shadow ${noOverlay ? "modal-standalone" : ""} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );

  if (noOverlay) {
    return content;
  }

  if (typeof document === "undefined") return null;

  const overlay = (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!canCloseOverlayRef.current) return;
        onClose?.();
      }}
    >
      {content}
    </div>
  );

  return createPortal(overlay, document.body);
}

export function ModalHeader({ children, className = "" }: SectionProps) {
  return <div className={`modal-header ${className}`}>{children}</div>;
}

export function ModalCloseBtn({
  onClick,
  className = "",
}: SectionProps & { onClick: MouseEventHandler }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={"modal-close-btn " + className}
    >
      <AiOutlineClose className={``} size={30} />
    </button>
  );
}

export function ModalBody({ children, className = "" }: SectionProps) {
  return <div className={`modal-body ${className}`}>{children}</div>;
}

export function ModalFooter({ children, className = "" }: SectionProps) {
  return <div className={`modal-footer ${className}`}>{children}</div>;
}

export function ModalForm({ children, className = "" }: SectionProps) {
  return <div className={`form-parent ${className}`}>{children}</div>;
}

export function ModalTextInput({
  children,
  id,
  placeholder = "",
  className = "",
  register,
  error,
  type = "text",
  variant = "default",
}: InputSectionProps & {
  register?: UseFormRegisterReturn;
  error?: FieldError | undefined;
  variant?: "default" | "description";
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <div className={`form ${className}`}>
      <label htmlFor={id}>{children}</label>
      {variant == "default" ? (
        <input id={id} type={type} placeholder={placeholder} {...register} />
      ) : (
        <textarea
          name={id}
          id={id}
          placeholder={placeholder}
          {...register}
        ></textarea>
      )}
      {error && (
        <span className="error-input-span">Erreur: {error?.message}</span>
      )}
    </div>
  );
}
export function ModalPasswordInput({
  children,
  id,
  placeholder = "",
  className = "",
  register,
  error,
}: InputSectionProps & {
  register: UseFormRegisterReturn;
  error?: FieldError | undefined;
}) {
  return (
    <div className={`form ${className}`}>
      <label htmlFor={id}>{children}</label>
      <input id={id} type="password" placeholder={placeholder} {...register} />
      {error && (
        <span className="error-input-span">Erreur: {error?.message}</span>
      )}
    </div>
  );
}

export function ModalSelectInput({
  children,
  id,
  className = "",
  register,
  error,
  optionList,
}: InputSectionProps & {
  register?: UseFormRegisterReturn;
  error?: FieldError | undefined;
  optionList: { text: string; value: string }[];
}) {
  return (
    <div className={`form ${className}`}>
      <label htmlFor={id}>{children}</label>
      <select id={id} {...register}>
        {optionList.map((op, i) => (
          <option key={`opt-${i}`} value={op.value}>
            {op.text}
          </option>
        ))}
      </select>
      {error && (
        <span className="error-input-span">Erreur: {error?.message}</span>
      )}
    </div>
  );
}

export default Modal;
