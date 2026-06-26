import PageHeader from "@/components/page/PageHeader";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import "./page.css";

export default function AdminDashboard() {
  return (
    <>
      <PageHeader
        title="Bienvenue admin"
        description="Voici votre espace administrateur"
      ></PageHeader>

      <section className="page-container">
        <div className="dashboard-stats-card">
          <div className="shadow stat-card">
            <h1 className="stat-name">Ticket ouvert</h1>
            <h1 className="stat-amount stat-amount--success">1</h1>
          </div>

          <div className="shadow stat-card">
            <h1 className="stat-name">Ticket non-assignés</h1>
            <h1 className="stat-amount stat-amount--info">1</h1>
          </div>

          <div className="shadow stat-card">
            <h1 className="stat-name">Nombre de clients</h1>
            <h1 className="stat-amount stat-amount--error">1</h1>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="shadow panel-container">
            <div className="panel-header">
              <h1>Tickets par statut</h1>
            </div>

            <div className="panel-content">
              <div className="panel-stats">
                <p className="panel-stat-text">En cour</p>
                <div className="panel-stat-bar panel-stat-bar--success"></div>
              </div>

              <div className="panel-stats">
                <p className="panel-stat-text">Ouvert</p>
                <div className="panel-stat-bar panel-stat-bar--info"></div>
              </div>

              <div className="panel-stats">
                <p className="panel-stat-text">Fermé</p>
                <div className="panel-stat-bar panel-stat-bar--error"></div>
              </div>
            </div>
          </div>

          <div className="shadow panel-container">
            <div className="panel-header">
              <h1>Tickets par type</h1>
            </div>

            <div className="panel-content">
              <div className="panel-stats">
                <p className="panel-stat-text">En cour</p>
                <div className="panel-stat-bar panel-stat-bar--success"></div>
              </div>

              <div className="panel-stats">
                <p className="panel-stat-text">Ouvert</p>
                <div className="panel-stat-bar panel-stat-bar--info"></div>
              </div>

              <div className="panel-stats">
                <p className="panel-stat-text">Fermé</p>
                <div className="panel-stat-bar panel-stat-bar--error"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
