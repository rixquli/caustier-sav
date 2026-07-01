import Modal, {
  ModalBody,
  ModalCloseBtn,
  ModalFooter,
  ModalHeader,
  ModalTextInput,
} from "./Modal";
import Separator from "../Separator";
import Button from "../Button";
import { useForm } from "react-hook-form";
import { Machine } from "@/types/machine";

export function CreateMachine({
  isOpen,
  setIsOpen,
  clientId,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  clientId?: number;
}) {
  const { register, handleSubmit, reset } = useForm<Omit<Machine, "id">>();
  async function onSubmit(data: Omit<Machine, "id">) {
    let body: Omit<Machine, "id"> = data;
    if (clientId) {
      body = { ...body, assigned_to: clientId };
    }

    const response = await fetch("/api/machines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      reset();
      setIsOpen(false);
    }
    const result = await response.json();
    console.log(result);
  }
  return (
    <Modal isOpen={isOpen}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader>
          <h1>Créer une machine</h1>{" "}
          <ModalCloseBtn onClick={() => setIsOpen(false)} />
        </ModalHeader>
        <Separator />
        <ModalBody>
          <div className="form-parent">
            <ModalTextInput
              id="machine-name"
              placeholder="Nom de la machine"
              register={register("name", { required: true })}
            >
              Nom de la machine
            </ModalTextInput>
            <ModalTextInput
              id="machine-type"
              placeholder="Type de machine"
              register={register("type", { required: false })}
            >
              Type de machine
            </ModalTextInput>
            <ModalTextInput
              id="machine-number-ligne"
              placeholder="Nombre de ligne"
              register={register("number_ligne", { required: true })}
            >
              Nombre de ligne
            </ModalTextInput>
            <ModalTextInput
              id="machine-product"
              placeholder="Produit"
              register={register("product", { required: false })}
            >
              Produit
            </ModalTextInput>
            <ModalTextInput
              id="machine-version"
              placeholder="Version"
              register={register("version", { required: false })}
            >
              Version
            </ModalTextInput>
            <ModalTextInput
              id="machine-service-date"
              placeholder="Date de service"
              register={register("service_date", { required: false })}
            >
              Date de service
            </ModalTextInput>
            <ModalTextInput
              id="machine-tel-pilote"
              placeholder="Téléphone du pilote"
              register={register("tel_pilote", { required: false })}
            >
              Téléphone du pilote
            </ModalTextInput>
            <ModalTextInput
              id="machine-technician-name"
              placeholder="Nom du technicien"
              register={register("technician_name", { required: false })}
            >
              Nom du technicien
            </ModalTextInput>
            <ModalTextInput
              id="machine-tel-technician"
              placeholder="Téléphone du technicien"
              register={register("tel_technician", { required: false })}
            >
              Téléphone du technicien
            </ModalTextInput>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="submit">Envoyer</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
