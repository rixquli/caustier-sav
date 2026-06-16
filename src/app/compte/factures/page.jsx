import PageLayout from "@/components/PageLayout";

export default function FacturesPage() {
  return (
    <PageLayout
      title="Mes factures"
      description="Consultez et téléchargez vos factures."
    >
      <div className="page-card">
        <p>Aucune facture disponible.</p>
      </div>
    </PageLayout>
  );
}
