type BadgeProps = {
  children?: React.ReactNode;
  className?: string;
  icon: React.ReactNode;
  text: string;
  reversed?: boolean;
  iconColor?: string;
};

export default function Badge({
  className,
  icon,
  text,
  reversed = false,
  iconColor,
}: BadgeProps) {
  const iconEl = <span style={{ color: iconColor }}>{icon}</span>;

  return (
    <div className={`badge ${className}`}>
      {reversed && iconEl}
      <span>{text}</span>
      {!reversed && iconEl}
    </div>
  );
}
