"use client";
import PageHeader from "@/components/page/PageHeader";
import "./page.css";
import Button from "@/components/Button";
import { BiPlus } from "react-icons/bi";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal, {
  ModalBody,
  ModalCloseBtn,
  ModalFooter,
  ModalHeader,
  ModalSelectInput,
  ModalTextInput,
} from "@/components/Modal/Modal";
import Separator from "@/components/Separator";
import { Stats } from "@/app/api/stats/tickets/route";
import { Priority, Status } from "@/types/ticket";

type FormData = {
  title: string;
  description: string;
};

export default function AdminDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormData>();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats/tickets").then((res) => {
      res.json().then((data) => {
        setStats(data);
        console.log(data);
        console.log(
          ((data.statsByPriority.find(
            (priority: { priority: Priority; count: number }) =>
              priority.priority === Priority.Haute,
          )?.count ?? 0) /
            (data.statsByPriority.reduce(
              (acc: number, curr: { priority: Priority; count: number }) =>
                acc + curr.count,
              0,
            ) ?? 0)) *
            100,
        );
      });
    });
  }, []);

  async function onSubmit(data: FormData) {
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      reset();
    }

    const result = await response.json();
    console.log(result);
  }
  return (
    <>
      <PageHeader
        title="Bienvenue admin"
        description="Voici votre espace administrateur"
      >
        <Button text="Nouveau ticket" onClick={() => setIsOpen(true)}>
          <BiPlus size={30} />
        </Button>
      </PageHeader>

      <section className="page-container">
        <div className="dashboard-stats-card">
          <div className="shadow stat-card">
            <h1 className="stat-name">Ticket ouvert</h1>
            <h1 className="stat-amount stat-amount--success">
              {stats?.totalOpen ?? 0}
            </h1>
          </div>

          <div className="shadow stat-card">
            <h1 className="stat-name">Ticket non-assignés</h1>
            <h1 className="stat-amount stat-amount--info">
              {stats?.totalUnassigned ?? 0}
            </h1>
          </div>

          <div className="shadow stat-card">
            <h1 className="stat-name">Nombre de clients</h1>
            <h1 className="stat-amount stat-amount--error">
              {stats?.totalClients ?? 0}
            </h1>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="shadow panel-container panel-container--status">
            <div className="panel-header">
              <h1>Tickets par statut</h1>
            </div>

            <div className="panel-content">
              <div className="panel-stats">
                <p className="panel-stat-text">Ouvert</p>
                <div
                  className="panel-stat-bar panel-stat-bar--info"
                  style={{
                    width: `${
                      ((stats?.statsByStatus.find(
                        (status) => status.status === Status.Ouvert,
                      )?.count ?? 0) /
                        (stats?.statsByStatus.reduce(
                          (acc, curr) => acc + curr.count,
                          0,
                        ) ?? 0)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>

              <div className="panel-stats">
                <p className="panel-stat-text">Fermé</p>
                <div
                  className="panel-stat-bar panel-stat-bar--error"
                  style={{
                    width: `${
                      ((stats?.statsByStatus.find(
                        (status) => status.status === Status.Fermé,
                      )?.count ?? 0) /
                        (stats?.statsByStatus.reduce(
                          (acc, curr) => acc + curr.count,
                          0,
                        ) ?? 0)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="shadow panel-container">
            <div className="panel-header">
              <h1>Tickets par priorité</h1>
            </div>

            <div className="panel-content">
              <div className="panel-stats">
                <p className="panel-stat-text">Basse</p>
                <div
                  className="panel-stat-bar panel-stat-bar--info"
                  style={{
                    width: `${
                      ((stats?.statsByPriority.find(
                        (priority) => priority.priority === Priority.Basse,
                      )?.count ?? 0) /
                        (stats?.statsByPriority.reduce(
                          (acc, curr) => acc + curr.count,
                          0,
                        ) ?? 0)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>

              <div className="panel-stats">
                <p className="panel-stat-text">Normal</p>
                <div
                  className="panel-stat-bar panel-stat-bar--success"
                  style={{
                    width: `${
                      ((stats?.statsByPriority.find(
                        (priority) => priority.priority === Priority.Normal,
                      )?.count ?? 0) /
                        (stats?.statsByPriority.reduce(
                          (acc, curr) => acc + curr.count,
                          0,
                        ) ?? 0)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>

              <div className="panel-stats">
                <p className="panel-stat-text">Haute</p>
                <div
                  className="panel-stat-bar panel-stat-bar--warning"
                  style={{
                    width: `${
                      ((stats?.statsByPriority.find(
                        (priority: { priority: Priority; count: number }) =>
                          priority.priority === Priority.Haute,
                      )?.count ?? 0) /
                        (stats?.statsByPriority.reduce(
                          (
                            acc: number,
                            curr: { priority: Priority; count: number },
                          ) => acc + curr.count,
                          0,
                        ) ?? 0)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>

              <div className="panel-stats">
                <p className="panel-stat-text">Critique</p>
                <div
                  className="panel-stat-bar panel-stat-bar--error"
                  style={{
                    width: `${
                      ((stats?.statsByPriority.find(
                        (priority) => priority.priority === Priority.Critique,
                      )?.count ?? 0) /
                        (stats?.statsByPriority.reduce(
                          (acc, curr) => acc + curr.count,
                          0,
                        ) ?? 0)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Modal isOpen={isOpen}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            <h1>Créer un ticket</h1>{" "}
            <ModalCloseBtn onClick={() => setIsOpen(false)} />
          </ModalHeader>
          <Separator />
          <ModalBody>
            <div className="form-parent">
              <ModalTextInput
                id="ticket-title"
                placeholder="Titre"
                register={register("title", { required: true })}
              >
                Titre du ticket
              </ModalTextInput>
              <ModalTextInput
                id="ticket-description"
                placeholder="Description"
                variant="description"
                register={register("description", { required: true })}
              >
                Description du ticket
              </ModalTextInput>
              <ModalSelectInput
                id="ticket-client"
                optionList={[
                  { value: "client1", text: "Client 1" },
                  { value: "client2", text: "Client 2" },
                ]}
              >
                Client concerné
              </ModalSelectInput>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="submit">Envoyer</Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
