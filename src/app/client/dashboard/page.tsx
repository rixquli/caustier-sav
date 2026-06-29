"use client";

import NewTicketButton from "@/components/client/NewTicketButton";
import TicketTable from "@/components/client/TicketTable";
import PageHeader from "@/components/page/PageHeader";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const { data: session } = authClient.useSession();

  return (
    <>
      <PageHeader
        title={"Bienvenue " + session?.user.name}
        description="Voici votre espace client"
      >
        <NewTicketButton />
      </PageHeader>
      <section>
        <h4>Vos tickets</h4>
        <TicketTable />
      </section>
    </>
  );
}
