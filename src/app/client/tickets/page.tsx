"use client";

import NewTicketButton from "@/components/client/NewTicketButton";
import TicketTable from "@/components/client/TicketTable";
import PageHeader from "@/components/page/PageHeader";

export default function TicketList() {
  return (
    <>
      <PageHeader title="Tickets" description="Voici la liste de vos tickets">
        <NewTicketButton />
      </PageHeader>
      <section>
        <h4>Vos tickets</h4>
        <TicketTable />
      </section>
    </>
  );
}
