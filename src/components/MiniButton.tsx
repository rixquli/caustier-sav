import { MouseEventHandler } from "react";

type MiniButtonProps = {
  className?: string;
  color: string;
  icon: React.ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children?: React.ReactNode;
};

export function MiniButton({
  children,
  className,
  color,
  icon,
  onClick,
}: MiniButtonProps) {
  return (
    <button
      style={{ backgroundColor: color }}
      onClick={onClick}
      className={`mini-btn ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
