"use client";
import Image from "next/image";
import Modal, {
  ModalBody,
  ModalCloseBtn,
  ModalFooter,
  ModalHeader,
  ModalPasswordInput,
  ModalTextInput,
} from "@/components/Modal";
import { useForm } from "react-hook-form";
import Separator from "@/components/Separator";

type FormData = {
  email: string;
  password: string;
};

export default function LoginModal() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  function onSubmit(data: FormData) {
    console.log(data);
    // onClose?.();
  }
  return (
    <Modal noOverlay>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="modal-logo">
          <Image src="/logo-caustier.png" width={100} height={100} alt="logo" />
        </div>

        <ModalHeader>
          <div className="flex-clo w-full">
            <h1>Connexion</h1>
            <span>Connectez-vous à votre compte</span>
            <Separator />
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="form-parent">
            <ModalTextInput
              id="login-id-input"
              placeholder="Identifiant"
              register={register("email", { required: true })}
              error={errors.email}
            >
              Identifiant
            </ModalTextInput>

            <ModalPasswordInput
              id="login-password-input"
              placeholder="********"
              register={register("password", {
                required: "Mot de passe requis",
                minLength: {
                  value: 6,
                  message: "Minimum 6 caractères",
                },
              })}
              error={errors.password}
            >
              Mot de passe
            </ModalPasswordInput>
          </div>
        </ModalBody>

        <ModalFooter>
          <button className="login-btn" type="submit">
            Se connecter
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
