import { FaArrowRightLong } from "react-icons/fa6";
import Badge from "@/components/Badge";
import { MouseEventHandler } from "react";

export default function Card({
  title,
  desc,
  badgeText,
  cardBtn,
  onClick,
  className,
}: {
  className?: string;
  title: string;
  desc?: React.ReactNode | string;
  badgeText: {
    reversed: boolean;
    text: string;
    icon: React.ReactNode;
    iconColor: string;
  };
  cardBtn?: {
    textCard: string;
    iconCard: React.ReactNode;
    onClick?: MouseEventHandler<HTMLButtonElement>;
  };
  onClick?: MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div onClick={onClick} className={"card-item " + className}>
      <div className="card-content">
        <div className="card-image"></div>
        <h1 className="card-name">{title}</h1>
        {desc && <p className="card-desc">{desc}</p>}
        <Badge
          className="card-badge"
          icon={badgeText.icon}
          text={badgeText.text}
          reversed={badgeText.reversed}
          iconColor={badgeText.iconColor}
        />
      </div>

      {cardBtn && (
        <div className="card-footer">
          <button className="card-btn" onClick={cardBtn.onClick}>
            {cardBtn.textCard}
            {cardBtn.iconCard}
          </button>
        </div>
      )}
    </div>
  );
}
