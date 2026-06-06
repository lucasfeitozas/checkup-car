import { create } from "zustand";

import { useAuthStore } from "@/store/authStore";
import { storage } from "@/lib/storage";

export type Vehicle = {
  id: string;
  nickname: string;
  brand?: string;
  model: string;
  year: number;
  plate: string;
  currentKm: number;
};

export type NewVehicleInput = {
  nickname: string;
  brand?: string;
  model: string;
  year: number;
  plate: string;
  currentKm: number;
};

export type VehicleListItem = Pick<
  Vehicle,
  "id" | "nickname" | "brand" | "model" | "year" | "plate" | "currentKm"
>;

export type VehicleValidationError = {
  field: "plate" | "nickname" | "brand" | "model" | "year" | "currentKm" | "limit";
  message: string;
};

export type VehicleState = {
  vehicles: Vehicle[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addVehicle: (vehicle: NewVehicleInput) => Promise<Vehicle>;
  updateKm: (vehicleId: string, currentKm: number) => Promise<void>;
  getVehicleById: (vehicleId: string) => Vehicle | undefined;
  getVehicleList: () => VehicleListItem[];
};

export const MAX_VEHICLES_PER_USER = 5;
const VEHICLES_KEY_PREFIX = "checkup-car.vehicles.";

function canonicalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function getVehiclesStorageKey() {
  const auth = useAuthStore.getState();
  const userId = auth.user?.id ?? "local-user";
  return `${VEHICLES_KEY_PREFIX}${userId}`;
}

async function persistVehicles(vehicles: Vehicle[]) {
  const key = getVehiclesStorageKey();
  await storage.setItem(key, JSON.stringify(vehicles));
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  isHydrated: false,
  async hydrate() {
    const key = getVehiclesStorageKey();
    const raw = await storage.getItem(key);

    if (!raw) {
      set({ vehicles: [], isHydrated: true });
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      const vehicles = Array.isArray(parsed) ? (parsed as Vehicle[]) : [];
      set({ vehicles, isHydrated: true });
    } catch {
      set({ vehicles: [], isHydrated: true });
    }
  },
  async addVehicle(input) {
    const current = get().vehicles;
    if (current.length >= MAX_VEHICLES_PER_USER) {
      throw new Error(`Limite de ${MAX_VEHICLES_PER_USER} veículos atingido.`);
    }

    const canonicalPlate = canonicalizePlate(input.plate);
    const hasDuplicatePlate = current.some(
      (existing) => canonicalizePlate(existing.plate) === canonicalPlate,
    );
    if (hasDuplicatePlate) {
      throw new Error(`Já existe um veículo cadastrado com a placa ${input.plate}.`);
    }

    const vehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      nickname: input.nickname,
      brand: input.brand,
      model: input.model,
      year: input.year,
      plate: input.plate,
      currentKm: input.currentKm,
    };

    const nextVehicles = [vehicle, ...current];
    set({ vehicles: nextVehicles });

    try {
      await persistVehicles(nextVehicles);
    } catch {}

    return vehicle;
  },
  async updateKm(vehicleId, currentKm) {
    const nextVehicles = get().vehicles.map((vehicle) =>
      vehicle.id === vehicleId ? { ...vehicle, currentKm } : vehicle,
    );

    set({ vehicles: nextVehicles });

    try {
      await persistVehicles(nextVehicles);
    } catch {}
  },
  getVehicleById(vehicleId) {
    return get().vehicles.find((vehicle) => vehicle.id === vehicleId);
  },
  getVehicleList() {
    return get().vehicles;
  },
}));
