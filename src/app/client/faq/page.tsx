import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ListPageHeader from "@/components/page/ListPageHeader";
import { FcElectronics } from "react-icons/fc";
import Card from "@/components/Card";

export default function faq() {
  return (
    <>
      <ListPageHeader
        isAdmin={false}
        btnText="Nouvelle FAQ"
        isFilter={true}
        title="FAQ"
      />
      <div className="page-list-container">
        <Card
          title="Problème pesée"
          desc="Debrancher le cable ici-présent et ne pa..."
          badgeText={{
            reversed: false,
            text: "Electronique",
            icon: <FcElectronics />,
            iconColor: "#ff0000",
          }}
        ></Card>
      </div>
    </>
  );
}
