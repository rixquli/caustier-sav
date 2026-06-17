import { redirect } from "next/navigation";

export default function NewUserRedirect() {
  redirect("/admin/clients/new");
}
