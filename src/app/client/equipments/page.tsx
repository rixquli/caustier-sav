"use client";
import ListPageHeader from "@/components/page/ListPageHeader";
import { FcElectronics } from "react-icons/fc";
import Card from "@/components/Card";
import { usePathname, useRouter } from "next/navigation";
import { GrStatusGoodSmall } from "react-icons/gr";

const machines = [
  {
    id: "1",
    title: "Calibreusse",
    // type: "Electronique",
    icon: <GrStatusGoodSmall />,
  },
];
export default function Faq() {
  return (
    <>
      <ListPageHeader
        isAdmin={false}
        isFilter={false}
        title="Mes équipements"
      />
      <div className="page-list-container">
        {machines
          // .filter(
          //   (el) =>
          //     globalFilter == "" ||
          //     el.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
          //     el.desc.toLowerCase().includes(globalFilter.toLowerCase()) ||
          //     el.type.toLowerCase().includes(globalFilter.toLowerCase()),
          // )
          .map((machine) => {
            return (
              <Card
                key={machine.id}
                title={machine.title}
                // desc="Debrancher le cable ici-présent et ne pa..."
                badgeText={{
                  reversed: false,
                  text: "En marche",
                  icon: <GrStatusGoodSmall />,
                  iconColor: "#00ff00",
                }}
              ></Card>
            );
          })}
      </div>
    </>
  );
}
