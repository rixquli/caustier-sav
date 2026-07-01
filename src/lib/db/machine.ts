import { Machine } from "@/types/machine";
import { db } from "./db";

export type MachineFilter = { idClient?: string };

export function getMachines(filter: MachineFilter): Machine[] {
  if (filter.idClient) {
    return db
      .prepare(`SELECT * FROM machines WHERE assigned_to = ?`)
      .all(filter.idClient) as Machine[];
  }
  return db.prepare(`SELECT * FROM machines`).all() as Machine[];
}

export function getMachine(id: Machine["id"]): Machine {
  return db
    .prepare(`SELECT * FROM machines WHERE id = ?`)
    .all(id)[0] as Machine;
}

export function createMachine(machine: Omit<Machine, "id">): boolean {
  try {
    db.prepare(
      `INSERT INTO machines (name, type, assigned_to, number_ligne, product, version, service_date, tel_pilote, technician_name, tel_technician, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      machine.name,
      machine.type,
      machine.assigned_to,
      machine.number_ligne,
      machine.product,
      machine.version,
      machine.service_date,
      machine.tel_pilote,
      machine.technician_name,
      machine.tel_technician,
      machine.note,
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export function updateMachine(machine: Machine): boolean {
  try {
    db.prepare(
      `UPDATE machines SET name = ?, type = ?, assigned_to = ?, number_ligne = ?, product = ?, version = ?, service_date = ?, tel_pilote = ?, technician_name = ?, tel_technician = ?, note = ? WHERE id = ?`,
    ).run(
      machine.name,
      machine.type,
      machine.assigned_to,
      machine.number_ligne,
      machine.product,
      machine.version,
      machine.service_date,
      machine.tel_pilote,
      machine.technician_name,
      machine.tel_technician,
      machine.note,
      machine.id,
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
