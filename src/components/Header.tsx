import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { AiOutlineSearch } from "react-icons/ai";
import { BiArrowToRight } from "react-icons/bi";
import { FaUser } from "react-icons/fa6";

export default function Header() {
  const logout = () => {
    authClient.signOut();
  };
  return (
    <header>
      <div className="header-container">
        <div className="header-left-part">
          <Image alt="logo" src="/header-logo.png" height={40} width={140} />
          <h2>Suivi Clients</h2>
        </div>
        <div className="header-middle-part">
          <label className="search-bar">
            <AiOutlineSearch size={18} />
            <input type="text" placeholder="Rechercher une requête ou FAQ.." />
          </label>
        </div>
        <div className="header-right-part">
          <button>
            <FaUser size={20} />
          </button>
          <button onClick={logout}>
            <BiArrowToRight size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
