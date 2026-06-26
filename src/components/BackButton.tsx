"use client";
import { useRouter } from "next/navigation";
import { BiArrowBack } from "react-icons/bi";

export function BackButton() {
  const router = useRouter();
  return (
    <button onClick={() => router.back()} className="BackButton">
      <BiArrowBack size={30} />
      <span>Retour</span>
    </button>
  );
}
