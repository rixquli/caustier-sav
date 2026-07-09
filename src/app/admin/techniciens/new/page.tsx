import { redirect } from "next/navigation";

export default function NewTechnicianRedirect() {
  redirect("/admin/techniciens?new=1");
}
