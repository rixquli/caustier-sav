import PageLayout from "@/components/PageLayout";

export default function DemandesPage() {
  return (
    <PageLayout
      title="Mes demandes"
      description="Historique et suivi de vos demandes SAV."
    >
      <div className="page-card">
        <p>Aucune demande pour le moment.</p>
      </div>
    </PageLayout>
  );
}
