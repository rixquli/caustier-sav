import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Button from "@/components/Button";
import { GoPlus } from "react-icons/go";

export default function ListPageHeader({
  isAdmin,
  btnText,
  isFilter,
  title,
}: {
  isAdmin: boolean;
  btnText?: string;
  isFilter: boolean;
  title: string;
}) {
  return (
    <div className="list-page-header">
      <div className="list-page-header-top">
        <h2 className="page-header-title">{title}</h2>
        {isAdmin && (
          <Button text={btnText}>
            <GoPlus />
          </Button>
        )}
      </div>

      <div className="list-page-header-bot">
        <input className="input-bar" placeholder="Rechercher..." />

        {isFilter && (
          <div className="filter-container">
            <select>
              <option value="Electronique">Electronique</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
