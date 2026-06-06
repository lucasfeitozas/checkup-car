import { create } from "zustand";

import { useAuthStore } from "@/features/auth/stores/authStore";
import type { KmPromptFrequency } from "@/features/vehicles/rules/kmReminder";
import { shouldRequestKmUpdate } from "@/features/vehicles/rules/kmReminder";
import { storage } from "@/core/storage/storage";

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

export type KmRecord = {
  id: string;
  vehicleId: string;
  km: number;
  recordedAt: string;
};

export type VehicleValidationError = {
  field: "plate" | "nickname" | "brand" | "model" | "year" | "currentKm" | "limit";
  message: string;
};

export type VehicleState = {
  vehicles: Vehicle[];
  kmRecords: KmRecord[];
  kmPromptFrequency: KmPromptFrequency;
  lastKmPromptAtByVehicleId: Record<string, string>;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addVehicle: (vehicle: NewVehicleInput) => Promise<Vehicle>;
  recordKm: (vehicleId: string, currentKm: number, recordedAt?: string) => Promise<KmRecord>;
  updateKm: (vehicleId: string, currentKm: number) => Promise<void>;
  setKmPromptFrequency: (frequency: KmPromptFrequency) => Promise<void>;
  markKmPromptShown: (vehicleId: string, promptedAt?: string) => Promise<void>;
  getVehicleById: (vehicleId: string) => Vehicle | undefined;
  getVehicleList: () => VehicleListItem[];
  getKmRecordsByVehicleId: (vehicleId: string) => KmRecord[];
  getVehiclesPendingKmPrompt: (now?: Date) => Vehicle[];
};

export const MAX_VEHICLES_PER_USER = 5;
const VEHICLES_KEY_PREFIX = "checkup-car.vehicles.";
const DEFAULT_KM_PROMPT_FREQUENCY: KmPromptFrequency = "daily";

function canonicalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function getVehiclesStorageKey() {
  const auth = useAuthStore.getState();
  const userId = auth.user?.id ?? "local-user";
  return `${VEHICLES_KEY_PREFIX}${userId}`;
}

type PersistedVehicleState = {
  vehicles: Vehicle[];
  kmRecords: KmRecord[];
  kmPromptFrequency: KmPromptFrequency;
  lastKmPromptAtByVehicleId: Record<string, string>;
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isKmPromptFrequency(value: unknown): value is KmPromptFrequency {
  return value === "daily" || value === "weekly";
}

function createInitialKmRecord(vehicle: Vehicle): KmRecord {
  return {
    id: `km-${vehicle.id}-initial`,
    vehicleId: vehicle.id,
    km: vehicle.currentKm,
    recordedAt: new Date(0).toISOString(),
  };
}

function parsePersistedState(raw: string): PersistedVehicleState {
  const parsed = JSON.parse(raw) as unknown;

  if (Array.isArray(parsed)) {
    const vehicles = parsed as Vehicle[];
    return {
      vehicles,
      kmRecords: vehicles.map(createInitialKmRecord),
      kmPromptFrequency: DEFAULT_KM_PROMPT_FREQUENCY,
      lastKmPromptAtByVehicleId: {},
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      vehicles: [],
      kmRecords: [],
      kmPromptFrequency: DEFAULT_KM_PROMPT_FREQUENCY,
      lastKmPromptAtByVehicleId: {},
    };
  }

  const state = parsed as Partial<PersistedVehicleState>;
  const vehicles = Array.isArray(state.vehicles) ? state.vehicles : [];
  const kmRecords = Array.isArray(state.kmRecords)
    ? state.kmRecords
    : vehicles.map(createInitialKmRecord);

  return {
    vehicles,
    kmRecords,
    kmPromptFrequency: isKmPromptFrequency(state.kmPromptFrequency)
      ? state.kmPromptFrequency
      : DEFAULT_KM_PROMPT_FREQUENCY,
    lastKmPromptAtByVehicleId:
      state.lastKmPromptAtByVehicleId && typeof state.lastKmPromptAtByVehicleId === "object"
        ? state.lastKmPromptAtByVehicleId
        : {},
  };
}

async function persistVehicleState(state: PersistedVehicleState) {
  const key = getVehiclesStorageKey();
  await storage.setItem(key, JSON.stringify(state));
}

function buildPersistedState(state: VehicleState): PersistedVehicleState {
  return {
    vehicles: state.vehicles,
    kmRecords: state.kmRecords,
    kmPromptFrequency: state.kmPromptFrequency,
    lastKmPromptAtByVehicleId: state.lastKmPromptAtByVehicleId,
  };
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  kmRecords: [],
  kmPromptFrequency: DEFAULT_KM_PROMPT_FREQUENCY,
  lastKmPromptAtByVehicleId: {},
  isHydrated: false,
  async hydrate() {
    const key = getVehiclesStorageKey();
    const raw = await storage.getItem(key);

    if (!raw) {
      set({
        vehicles: [],
        kmRecords: [],
        kmPromptFrequency: DEFAULT_KM_PROMPT_FREQUENCY,
        lastKmPromptAtByVehicleId: {},
        isHydrated: true,
      });
      return;
    }

    try {
      const persisted = parsePersistedState(raw);
      set({ ...persisted, isHydrated: true });
    } catch {
      set({
        vehicles: [],
        kmRecords: [],
        kmPromptFrequency: DEFAULT_KM_PROMPT_FREQUENCY,
        lastKmPromptAtByVehicleId: {},
        isHydrated: true,
      });
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

    const now = new Date().toISOString();
    const vehicle: Vehicle = {
      id: createId("vehicle"),
      nickname: input.nickname,
      brand: input.brand,
      model: input.model,
      year: input.year,
      plate: input.plate,
      currentKm: input.currentKm,
    };
    const kmRecord: KmRecord = {
      id: createId("km"),
      vehicleId: vehicle.id,
      km: input.currentKm,
      recordedAt: now,
    };

    const nextVehicles = [vehicle, ...current];
    const previous = buildPersistedState(get());
    set({ vehicles: nextVehicles, kmRecords: [kmRecord, ...get().kmRecords] });

    try {
      await persistVehicleState(buildPersistedState(get()));
    } catch (e) {
      set(previous);
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar veículo.";
      throw new Error(`Não foi possível salvar o veículo localmente. ${message}`);
    }

    return vehicle;
  },
  async recordKm(vehicleId, currentKm, recordedAt = new Date().toISOString()) {
    const currentVehicle = get().vehicles.find((vehicle) => vehicle.id === vehicleId);
    if (!currentVehicle) {
      throw new Error("Veículo não encontrado.");
    }

    if (!Number.isFinite(currentKm) || currentKm < 0) {
      throw new Error("Km atual deve ser um número maior ou igual a zero.");
    }

    if (currentKm < currentVehicle.currentKm) {
      throw new Error(
        `Km atual deve ser maior ou igual ao último registro (${currentVehicle.currentKm.toLocaleString(
          "pt-BR",
        )} km).`,
      );
    }

    const kmRecord: KmRecord = {
      id: createId("km"),
      vehicleId,
      km: currentKm,
      recordedAt,
    };
    const previous = buildPersistedState(get());
    const nextVehicles = get().vehicles.map((vehicle) =>
      vehicle.id === vehicleId ? { ...vehicle, currentKm } : vehicle,
    );

    set({
      vehicles: nextVehicles,
      kmRecords: [kmRecord, ...get().kmRecords],
      lastKmPromptAtByVehicleId: {
        ...get().lastKmPromptAtByVehicleId,
        [vehicleId]: recordedAt,
      },
    });

    try {
      await persistVehicleState(buildPersistedState(get()));
    } catch (e) {
      set(previous);
      const message = e instanceof Error ? e.message : "Erro inesperado ao registrar km.";
      throw new Error(`Não foi possível salvar a km localmente. ${message}`);
    }

    return kmRecord;
  },
  async updateKm(vehicleId, currentKm) {
    await get().recordKm(vehicleId, currentKm);
  },
  async setKmPromptFrequency(frequency) {
    const previous = buildPersistedState(get());
    set({ kmPromptFrequency: frequency });

    try {
      await persistVehicleState(buildPersistedState(get()));
    } catch (e) {
      set(previous);
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar configuração.";
      throw new Error(`Não foi possível salvar a frequência localmente. ${message}`);
    }
  },
  async markKmPromptShown(vehicleId, promptedAt = new Date().toISOString()) {
    if (!get().vehicles.some((vehicle) => vehicle.id === vehicleId)) {
      throw new Error("Veículo não encontrado.");
    }

    const previous = buildPersistedState(get());
    set({
      lastKmPromptAtByVehicleId: {
        ...get().lastKmPromptAtByVehicleId,
        [vehicleId]: promptedAt,
      },
    });

    try {
      await persistVehicleState(buildPersistedState(get()));
    } catch (e) {
      set(previous);
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar lembrete.";
      throw new Error(`Não foi possível salvar o lembrete localmente. ${message}`);
    }
  },
  getVehicleById(vehicleId) {
    return get().vehicles.find((vehicle) => vehicle.id === vehicleId);
  },
  getVehicleList() {
    return get().vehicles;
  },
  getKmRecordsByVehicleId(vehicleId) {
    return get()
      .kmRecords.filter((record) => record.vehicleId === vehicleId)
      .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));
  },
  getVehiclesPendingKmPrompt(now = new Date()) {
    const state = get();
    return state.vehicles.filter((vehicle) =>
      shouldRequestKmUpdate(
        state.lastKmPromptAtByVehicleId[vehicle.id],
        state.kmPromptFrequency,
        now,
      ),
    );
  },
}));
