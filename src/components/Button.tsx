import { MouseEventHandler } from "react";

type variantBtn = "outline" | "full";

type btnColorType = "green" | "red" | "yellow";

const colorToClass: Record<btnColorType, string> = {
  green: "btn--green",
  red: "btn--red",
  yellow: "btn--yellow",
};

type btnType = {
  children?: React.ReactNode;
  className?: string;
  variant?: variantBtn;
  text?: string;
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
  color?: btnColorType;
  type?: "submit" | "reset" | "button" | undefined;
};

export default function Button({
  children,
  className = "",
  variant = "full",
  text,
  color = "green",
  type,
  onClick,
}: btnType) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn btn-${variant} ${colorToClass[color]} ${className}`}
    >
      {children}
      {text && <span>{text}</span>}
    </button>
  );
}
