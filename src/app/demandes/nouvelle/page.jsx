"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import DemandeForm from "@/components/DemandeForm";

export default function NouvelleDemandePage() {
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMachines(data?.machines ?? []));
  }, []);

  return (
    <PageLayout title="Nouvelle demande" description="Décrivez votre problème ou votre besoin.">
      <DemandeForm machines={machines} />
    </PageLayout>
  );
}
