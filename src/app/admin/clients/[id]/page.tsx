import PageHeader from "@/components/page/PageHeader";
import { BackButton } from "@/components/BackButton";
import Button from "@/components/Button";

import { HiOutlineTrash, HiPencilSquare } from "react-icons/hi2";
import { IoLockClosedSharp } from "react-icons/io5";

import "./page.css";

export default function clientDetai() {
  return (
    <>
      <PageHeader>
        <BackButton />
        <div className="client-detail-actions">
          <Button text="Supprimer" color="red">
            <HiOutlineTrash />
          </Button>
          <Button text="Archiver" color="yellow">
            <IoLockClosedSharp />
          </Button>
          <Button text="Modifier" color="green">
            <HiPencilSquare />
          </Button>
        </div>
      </PageHeader>

      <section className="page-container"></section>
    </>
  );
}
