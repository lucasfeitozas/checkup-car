import { create } from "zustand";

import { getSqliteDb } from "@/db/client";

export type Vehicle = {
  id: string;
  nickname: string;
  brand?: string;
  model: string;
  year: number;
  plate: string;
  currentKm: number;
};

const LOCAL_USER_ID = "local-user";

function canonicalizePlate(value: string) {
  return value.toUpperCase().replace(/[\s-]/g, "");
}

function slugifyModel(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type VehicleState = {
  vehicles: Vehicle[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addVehicle: (vehicle: Vehicle) => Promise<void>;
  updateKm: (vehicleId: string, currentKm: number) => Promise<void>;
};

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  isHydrated: false,
  async hydrate() {
    const sqliteDb = await getSqliteDb();
    if (!sqliteDb) {
      set({ isHydrated: true });
      return;
    }

    const rows = await sqliteDb.getAllAsync<{
      id: string;
      plate: string;
      nickname: string;
      year: number;
      currentKm: number;
      brand: string | null;
      model: string | null;
    }>(
      `
        SELECT
          c.id AS id,
          c.placa AS plate,
          c.nome_apelido AS nickname,
          c.ano AS year,
          c.km_atual AS currentKm,
          m.marca AS brand,
          m.modelo AS model
        FROM carros c
        LEFT JOIN modelos_carro m ON c.modelo_id = m.id
        WHERE c.usuario_id = ?
        ORDER BY c.criado_em DESC
      `,
      LOCAL_USER_ID,
    );

    set({
      vehicles: rows.map((row) => ({
        id: row.id,
        nickname: row.nickname,
        brand: row.brand || undefined,
        model: row.model ?? "",
        year: row.year,
        plate: row.plate,
        currentKm: row.currentKm,
      })),
      isHydrated: true,
    });
  },
  async addVehicle(vehicle) {
    const canonicalPlate = canonicalizePlate(vehicle.plate);
    const hasDuplicatePlate = get().vehicles.some(
      (existing) => canonicalizePlate(existing.plate) === canonicalPlate,
    );

    if (hasDuplicatePlate) {
      throw new Error(`Já existe um veículo cadastrado com a placa ${vehicle.plate}.`);
    }

    const sqliteDb = await getSqliteDb();
    if (sqliteDb) {
      const modelId = `manual-${slugifyModel(vehicle.model)}-${vehicle.year}`;
      const brand = vehicle.brand ?? "";

      await sqliteDb.runAsync(
        "INSERT OR IGNORE INTO modelos_carro (id, marca, modelo, ano_inicio, ano_fim) VALUES (?, ?, ?, ?, ?)",
        modelId,
        brand,
        vehicle.model,
        vehicle.year,
        vehicle.year,
      );

      try {
        await sqliteDb.runAsync(
          "INSERT INTO carros (id, usuario_id, modelo_id, placa, nome_apelido, ano, km_atual) VALUES (?, ?, ?, ?, ?, ?, ?)",
          vehicle.id,
          LOCAL_USER_ID,
          modelId,
          vehicle.plate,
          vehicle.nickname,
          vehicle.year,
          vehicle.currentKm,
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : "";
        if (message.includes("UNIQUE constraint failed")) {
          throw new Error(`Já existe um veículo cadastrado com a placa ${vehicle.plate}.`);
        }
        throw e;
      }
    }

    set((state) => ({ vehicles: [vehicle, ...state.vehicles] }));
  },
  async updateKm(vehicleId, currentKm) {
    const sqliteDb = await getSqliteDb();
    if (sqliteDb) {
      await sqliteDb.runAsync("UPDATE carros SET km_atual = ? WHERE id = ? AND usuario_id = ?", [
        currentKm,
        vehicleId,
        LOCAL_USER_ID,
      ]);
    }

    set((state) => ({
      vehicles: state.vehicles.map((vehicle) =>
        vehicle.id === vehicleId ? { ...vehicle, currentKm } : vehicle,
      ),
    }));
  },
}));
