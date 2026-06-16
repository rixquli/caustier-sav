export default function PageLayout({ title, description, children }) {
  return (
    <div className="page">
      <div className="page-header">
        <h1>{title}</h1>
        {description && <p className="page-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
