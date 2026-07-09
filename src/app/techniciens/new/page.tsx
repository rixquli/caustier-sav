import { redirect } from "next/navigation";

export default function NewUserRedirect() {
  redirect("/admin/techniciens?new=1");
}
