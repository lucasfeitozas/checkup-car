import { create } from "zustand";

import { useAuthStore } from "@/features/auth/stores/authStore";
import type { KmPromptFrequency } from "@/features/vehicles/rules/kmReminder";
import { shouldRequestKmUpdate } from "@/features/vehicles/rules/kmReminder";
import {
  calculateCustomMaintenanceSchedule,
  getMaintenanceEventType,
  normalizeMaintenanceName,
  normalizeMaintenanceNameForComparison,
  validateCustomMaintenanceInput,
  type MaintenanceEventTypeId,
} from "@/features/vehicles/rules/maintenanceEvents";
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

export type MaintenanceEvent = {
  id: string;
  vehicleId: string;
  typeId: MaintenanceEventTypeId;
  name: string;
  nextKm?: number;
  nextDate?: string;
  createdAt: string;
};

export type CustomMaintenanceType = {
  id: `custom-${string}`;
  name: string;
  intervalKm?: number;
  intervalMonths?: number;
  createdAt: string;
};

export type NewMaintenanceEventInput = {
  typeId: MaintenanceEventTypeId;
  customName?: string;
  nextKm?: number;
  nextDate?: string;
};

export type CustomMaintenanceExecutionInput = {
  lastExecutionKm?: number;
  lastExecutionDate?: string;
};

export type NewCustomMaintenanceInput = CustomMaintenanceExecutionInput & {
  name: string;
  intervalKm?: number;
  intervalMonths?: number;
};

export type VehicleValidationError = {
  field: "plate" | "nickname" | "brand" | "model" | "year" | "currentKm" | "limit";
  message: string;
};

export type VehicleState = {
  vehicles: Vehicle[];
  kmRecords: KmRecord[];
  maintenanceEvents: MaintenanceEvent[];
  customMaintenanceTypes: CustomMaintenanceType[];
  kmPromptFrequency: KmPromptFrequency;
  lastKmPromptAtByVehicleId: Record<string, string>;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addVehicle: (vehicle: NewVehicleInput) => Promise<Vehicle>;
  addMaintenanceEvent: (
    vehicleId: string,
    input: NewMaintenanceEventInput,
  ) => Promise<MaintenanceEvent>;
  createCustomMaintenanceEvent: (
    vehicleId: string,
    input: NewCustomMaintenanceInput,
  ) => Promise<MaintenanceEvent>;
  addCustomMaintenanceEvent: (
    vehicleId: string,
    typeId: CustomMaintenanceType["id"],
    input: CustomMaintenanceExecutionInput,
  ) => Promise<MaintenanceEvent>;
  recordKm: (vehicleId: string, currentKm: number, recordedAt?: string) => Promise<KmRecord>;
  updateKm: (vehicleId: string, currentKm: number) => Promise<void>;
  setKmPromptFrequency: (frequency: KmPromptFrequency) => Promise<void>;
  markKmPromptShown: (vehicleId: string, promptedAt?: string) => Promise<void>;
  getVehicleById: (vehicleId: string) => Vehicle | undefined;
  getVehicleList: () => VehicleListItem[];
  getKmRecordsByVehicleId: (vehicleId: string) => KmRecord[];
  getMaintenanceEventsByVehicleId: (vehicleId: string) => MaintenanceEvent[];
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
  maintenanceEvents: MaintenanceEvent[];
  customMaintenanceTypes: CustomMaintenanceType[];
  kmPromptFrequency: KmPromptFrequency;
  lastKmPromptAtByVehicleId: Record<string, string>;
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isKmPromptFrequency(value: unknown): value is KmPromptFrequency {
  return value === "daily" || value === "weekly";
}

function isMaintenanceEventTypeId(value: unknown): value is MaintenanceEventTypeId {
  return (
    typeof value === "string" &&
    (value.startsWith("custom-") ||
      Boolean(getMaintenanceEventType(value as MaintenanceEventTypeId)))
  );
}

function isValidMaintenanceEvent(value: unknown): value is MaintenanceEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Partial<MaintenanceEvent>;
  return (
    typeof event.id === "string" &&
    typeof event.vehicleId === "string" &&
    isMaintenanceEventTypeId(event.typeId) &&
    typeof event.name === "string" &&
    typeof event.createdAt === "string" &&
    (event.nextKm === undefined || typeof event.nextKm === "number") &&
    (event.nextDate === undefined || typeof event.nextDate === "string")
  );
}

function isValidCustomMaintenanceType(value: unknown): value is CustomMaintenanceType {
  if (!value || typeof value !== "object") {
    return false;
  }

  const type = value as Partial<CustomMaintenanceType>;
  return (
    typeof type.id === "string" &&
    type.id.startsWith("custom-") &&
    typeof type.name === "string" &&
    typeof type.createdAt === "string" &&
    (type.intervalKm === undefined || (Number.isInteger(type.intervalKm) && type.intervalKm > 0)) &&
    (type.intervalMonths === undefined ||
      (Number.isInteger(type.intervalMonths) && type.intervalMonths > 0)) &&
    (type.intervalKm !== undefined || type.intervalMonths !== undefined)
  );
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
      maintenanceEvents: [],
      customMaintenanceTypes: [],
      kmPromptFrequency: DEFAULT_KM_PROMPT_FREQUENCY,
      lastKmPromptAtByVehicleId: {},
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      vehicles: [],
      kmRecords: [],
      maintenanceEvents: [],
      customMaintenanceTypes: [],
      kmPromptFrequency: DEFAULT_KM_PROMPT_FREQUENCY,
      lastKmPromptAtByVehicleId: {},
    };
  }

  const state = parsed as Partial<PersistedVehicleState>;
  const vehicles = Array.isArray(state.vehicles) ? state.vehicles : [];
  const kmRecords = Array.isArray(state.kmRecords)
    ? state.kmRecords
    : vehicles.map(createInitialKmRecord);
  const maintenanceEvents = Array.isArray(state.maintenanceEvents)
    ? state.maintenanceEvents.filter(isValidMaintenanceEvent)
    : [];
  const customMaintenanceTypes = Array.isArray(state.customMaintenanceTypes)
    ? state.customMaintenanceTypes.filter(isValidCustomMaintenanceType)
    : [];

  return {
    vehicles,
    kmRecords,
    maintenanceEvents,
    customMaintenanceTypes,
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
    maintenanceEvents: state.maintenanceEvents,
    customMaintenanceTypes: state.customMaintenanceTypes,
    kmPromptFrequency: state.kmPromptFrequency,
    lastKmPromptAtByVehicleId: state.lastKmPromptAtByVehicleId,
  };
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  kmRecords: [],
  maintenanceEvents: [],
  customMaintenanceTypes: [],
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
        maintenanceEvents: [],
        customMaintenanceTypes: [],
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
        maintenanceEvents: [],
        customMaintenanceTypes: [],
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
  async addMaintenanceEvent(vehicleId, input) {
    if (!get().vehicles.some((vehicle) => vehicle.id === vehicleId)) {
      throw new Error("Veículo não encontrado.");
    }

    const type = getMaintenanceEventType(input.typeId);
    if (!type) {
      throw new Error("Tipo de manutenção inválido.");
    }

    const name = input.typeId === "custom" ? input.customName?.trim() : type.name;
    if (!name) {
      throw new Error("Informe o nome da manutenção personalizada.");
    }

    if (input.nextKm !== undefined && (!Number.isFinite(input.nextKm) || input.nextKm < 0)) {
      throw new Error("Próxima km deve ser um número maior ou igual a zero.");
    }

    if (input.nextDate !== undefined && Number.isNaN(Date.parse(input.nextDate))) {
      throw new Error("Data limite inválida.");
    }

    if (input.nextKm === undefined && input.nextDate === undefined) {
      throw new Error("Informe a próxima km ou a data limite da manutenção.");
    }

    const maintenanceEvent: MaintenanceEvent = {
      id: createId("maintenance"),
      vehicleId,
      typeId: input.typeId,
      name,
      nextKm: input.nextKm,
      nextDate: input.nextDate,
      createdAt: new Date().toISOString(),
    };
    const previous = buildPersistedState(get());

    set({ maintenanceEvents: [maintenanceEvent, ...get().maintenanceEvents] });

    try {
      await persistVehicleState(buildPersistedState(get()));
    } catch (e) {
      set(previous);
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar manutenção.";
      throw new Error(`Não foi possível salvar a manutenção localmente. ${message}`);
    }

    return maintenanceEvent;
  },
  async createCustomMaintenanceEvent(vehicleId, input) {
    const vehicle = get().vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) {
      throw new Error("Veículo não encontrado.");
    }

    const lastExecutionDate = input.lastExecutionDate
      ? new Date(input.lastExecutionDate)
      : undefined;
    const validation = validateCustomMaintenanceInput({
      name: input.name,
      intervalKm: input.intervalKm,
      intervalMonths: input.intervalMonths,
      lastExecutionKm: input.lastExecutionKm,
      lastExecutionDate,
      currentKm: vehicle.currentKm,
    });
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    const name = normalizeMaintenanceName(input.name);
    const normalizedName = normalizeMaintenanceNameForComparison(name);
    const hasDuplicateName = get().customMaintenanceTypes.some(
      (type) => normalizeMaintenanceNameForComparison(type.name) === normalizedName,
    );
    if (hasDuplicateName) {
      throw new Error("Já existe uma manutenção personalizada com esse nome.");
    }

    const now = new Date().toISOString();
    const type: CustomMaintenanceType = {
      id: createId("custom") as CustomMaintenanceType["id"],
      name,
      intervalKm: input.intervalKm,
      intervalMonths: input.intervalMonths,
      createdAt: now,
    };
    const schedule = calculateCustomMaintenanceSchedule({
      intervalKm: type.intervalKm,
      intervalMonths: type.intervalMonths,
      lastExecutionKm: input.lastExecutionKm,
      lastExecutionDate,
    });
    const event: MaintenanceEvent = {
      id: createId("maintenance"),
      vehicleId,
      typeId: type.id,
      name: type.name,
      ...schedule,
      createdAt: now,
    };
    const previous = buildPersistedState(get());

    set({
      customMaintenanceTypes: [type, ...get().customMaintenanceTypes],
      maintenanceEvents: [event, ...get().maintenanceEvents],
    });

    try {
      await persistVehicleState(buildPersistedState(get()));
    } catch (e) {
      set(previous);
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar manutenção.";
      throw new Error(`Não foi possível salvar a manutenção localmente. ${message}`);
    }

    return event;
  },
  async addCustomMaintenanceEvent(vehicleId, typeId, input) {
    const vehicle = get().vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) {
      throw new Error("Veículo não encontrado.");
    }

    const type = get().customMaintenanceTypes.find((item) => item.id === typeId);
    if (!type) {
      throw new Error("Tipo de manutenção personalizada não encontrado.");
    }

    const lastExecutionDate = input.lastExecutionDate
      ? new Date(input.lastExecutionDate)
      : undefined;
    const validation = validateCustomMaintenanceInput({
      name: type.name,
      intervalKm: type.intervalKm,
      intervalMonths: type.intervalMonths,
      lastExecutionKm: input.lastExecutionKm,
      lastExecutionDate,
      currentKm: vehicle.currentKm,
    });
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    const schedule = calculateCustomMaintenanceSchedule({
      intervalKm: type.intervalKm,
      intervalMonths: type.intervalMonths,
      lastExecutionKm: input.lastExecutionKm,
      lastExecutionDate,
    });
    const event: MaintenanceEvent = {
      id: createId("maintenance"),
      vehicleId,
      typeId,
      name: type.name,
      ...schedule,
      createdAt: new Date().toISOString(),
    };
    const previous = buildPersistedState(get());

    set({ maintenanceEvents: [event, ...get().maintenanceEvents] });

    try {
      await persistVehicleState(buildPersistedState(get()));
    } catch (e) {
      set(previous);
      const message = e instanceof Error ? e.message : "Erro inesperado ao salvar manutenção.";
      throw new Error(`Não foi possível salvar a manutenção localmente. ${message}`);
    }

    return event;
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
  getMaintenanceEventsByVehicleId(vehicleId) {
    return get()
      .maintenanceEvents.filter((event) => event.vehicleId === vehicleId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
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
