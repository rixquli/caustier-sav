import Button from "../Button";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "./Modal";

export default function DeleteModal() {
  return (
    <Modal>
      <ModalHeader>Êtes-vous sûr de vouloir le supprimer</ModalHeader>
      <ModalBody>Cette action est irréversible</ModalBody>
      <ModalFooter>
        <Button text="OUI" color="red"></Button>
        <Button text="NON" color="green" variant="outline"></Button>
      </ModalFooter>
    </Modal>
  );
}
