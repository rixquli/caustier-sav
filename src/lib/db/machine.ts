import { Machine } from "@/types/machine";
import { query, queryOne } from "./db";

export type MachineFilter = { idClient?: string };

export async function getMachines(filter: MachineFilter): Promise<Machine[]> {
  if (filter.idClient) {
    return (await query<Machine>(
      `SELECT * FROM machines WHERE assigned_to = $1`,
      [Number(filter.idClient)],
    )) as Machine[];
  }

  return (await query<Machine>(`SELECT * FROM machines`)) as Machine[];
}

export async function getMachine(id: Machine["id"]): Promise<Machine> {
  return (await queryOne<Machine>(
    `SELECT * FROM machines WHERE id = $1`,
    [id],
  )) as Machine;
}

export async function createMachine(
  machine: Omit<Machine, "id">,
): Promise<boolean> {
  try {
    await query(
      `INSERT INTO machines (name, type, assigned_to, number_ligne, product, version, service_date, tel_pilote, technician_name, tel_technician, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        machine.name,
        machine.type,
        machine.assigned_to ?? null,
        machine.number_ligne,
        machine.product,
        machine.version,
        machine.service_date,
        machine.tel_pilote,
        machine.technician_name,
        machine.tel_technician,
        machine.note,
      ],
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function updateMachine(machine: Machine): Promise<boolean> {
  try {
    await query(
      `UPDATE machines
       SET name = $1,
           type = $2,
           assigned_to = $3,
           number_ligne = $4,
           product = $5,
           version = $6,
           service_date = $7,
           tel_pilote = $8,
           technician_name = $9,
           tel_technician = $10,
           note = $11
       WHERE id = $12`,
      [
        machine.name,
        machine.type,
        machine.assigned_to ?? null,
        machine.number_ligne,
        machine.product,
        machine.version,
        machine.service_date,
        machine.tel_pilote,
        machine.technician_name,
        machine.tel_technician,
        machine.note,
        machine.id,
      ],
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
