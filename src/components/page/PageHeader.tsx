"use client";

export default function PageHeader({
  children,
  title,
  description,
}: {
  children?: React.ReactNode;
  title?: string;
  description?: string;
}) {
  if (!title && !description)
    return <div className="page-header">{children}</div>;
  return (
    <div className="page-header">
      <div className="page-header-texts">
        <h2 className="page-header-title">{title}</h2>
        <h5 className="page-header-desc">{description}</h5>
      </div>
      {children}
    </div>
  );
}
