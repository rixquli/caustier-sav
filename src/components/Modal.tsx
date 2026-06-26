"use client";
import React, { MouseEventHandler } from "react";
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

  return (
    <div className="modal-overlay" onClick={() => onClose?.()}>
      {content}
    </div>
  );
}

export function ModalHeader({ children, className = "" }: SectionProps) {
  return <div className={`modal-header ${className}`}>{children}</div>;
}

export function ModalCloseBtn({
  onClick,
  className = "",
}: SectionProps & { onClick: MouseEventHandler }) {
  return (
    <button onClick={onClick} className={"modal-close-btn " + className}>
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
  type = "default",
}: InputSectionProps & {
  register?: UseFormRegisterReturn;
  error?: FieldError | undefined;
  type?: "default" | "description";
}) {
  return (
    <div className={`form ${className}`}>
      <label htmlFor={id}>{children}</label>
      {type == "default" ? (
        <input id={id} type="text" placeholder={placeholder} {...register} />
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
