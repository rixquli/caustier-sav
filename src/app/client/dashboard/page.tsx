import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { BiPlus } from "react-icons/bi";
import Button from "@/components/Button";
import TicketTable from "@/components/client/TicketTable";
import PageHeader from "@/components/page/PageHeader";

export default function Home() {
  return (
    <>
      <PageHeader
        title="Bienvenue client"
        description="Voici votre espace client"
      >
        <Button text="Nouveau ticket">
          <BiPlus size={30} />
        </Button>
      </PageHeader>
      <section className="page-container">
        <h4>Vos tickets</h4>
        <TicketTable />
      </section>
    </>
  );
}
