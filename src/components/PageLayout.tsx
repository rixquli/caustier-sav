import type { ReactNode } from "react";

type PageLayoutProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

export default function PageLayout({
  title,
  description,
  children,
}: PageLayoutProps) {
  return (
    <div className="page">
      <div className="page-header">
        <h1>{title}</h1>
        {description &&
          (typeof description === "string" ? (
            <p className="page-muted">{description}</p>
          ) : (
            <div className="page-muted">{description}</div>
          ))}
      </div>
      {children}
    </div>
  );
}
