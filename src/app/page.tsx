import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/auth/redirect");
  return (
    <>
      {/* <Header />
      <div className="page-container">
        <Sidebar /> */}
      <main>Coucou</main>
      {/* </div> */}
    </>
  );
}
