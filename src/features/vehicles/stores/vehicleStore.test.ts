import * as SecureStore from "expo-secure-store";

import { useAuthStore } from "@/features/auth/stores/authStore";
import { type NewVehicleInput, useVehicleStore } from "@/features/vehicles/stores/vehicleStore";

const secureStoreMock = SecureStore as jest.Mocked<typeof SecureStore>;

function createVehicleInput(override?: Partial<NewVehicleInput>) {
  return {
    nickname: "Meu carro",
    brand: "Toyota",
    model: "Corolla",
    year: 2022,
    plate: "ABC-1234",
    currentKm: 42000,
    ...(override ?? {}),
  };
}

describe("vehicleStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: { id: "user-1", name: "User", email: "user@example.com" },
      accessToken: null,
      isHydrated: true,
    });
    useVehicleStore.setState({
      vehicles: [],
      kmRecords: [],
      kmPromptFrequency: "daily",
      lastKmPromptAtByVehicleId: {},
      isHydrated: false,
    });
    secureStoreMock.setItemAsync.mockResolvedValue();
  });

  it("hydrates empty state when storage has no data", async () => {
    secureStoreMock.getItemAsync.mockResolvedValueOnce(null);

    await useVehicleStore.getState().hydrate();

    expect(useVehicleStore.getState().vehicles).toEqual([]);
    expect(useVehicleStore.getState().isHydrated).toBe(true);
  });

  it("hydrates vehicles from storage", async () => {
    const key = "checkup-car.vehicles.user-1";
    const stored = [
      {
        id: "v-1",
        nickname: "Carro A",
        brand: "Honda",
        model: "Civic",
        year: 2021,
        plate: "ABC-1234",
        currentKm: 1000,
      },
    ];
    secureStoreMock.getItemAsync.mockImplementation(async (k) =>
      k === key ? JSON.stringify(stored) : null,
    );

    await useVehicleStore.getState().hydrate();

    expect(useVehicleStore.getState().vehicles).toEqual(stored);
    expect(useVehicleStore.getState().kmRecords).toEqual([
      {
        id: "km-v-1-initial",
        vehicleId: "v-1",
        km: 1000,
        recordedAt: "1970-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("hydrates persisted vehicle state with km records and prompt settings", async () => {
    const key = "checkup-car.vehicles.user-1";
    const stored = {
      vehicles: [
        {
          id: "v-1",
          nickname: "Carro A",
          brand: "Honda",
          model: "Civic",
          year: 2021,
          plate: "ABC-1234",
          currentKm: 1200,
        },
      ],
      kmRecords: [
        {
          id: "km-1",
          vehicleId: "v-1",
          km: 1200,
          recordedAt: "2026-06-01T10:00:00.000Z",
        },
      ],
      kmPromptFrequency: "weekly",
      lastKmPromptAtByVehicleId: { "v-1": "2026-06-01T10:00:00.000Z" },
    };
    secureStoreMock.getItemAsync.mockImplementation(async (k) =>
      k === key ? JSON.stringify(stored) : null,
    );

    await useVehicleStore.getState().hydrate();

    expect(useVehicleStore.getState()).toMatchObject(stored);
  });

  it("blocks duplicate plate (case/format insensitive)", async () => {
    await useVehicleStore.getState().addVehicle(createVehicleInput({ plate: "abc-1234" }));

    await expect(
      useVehicleStore.getState().addVehicle(createVehicleInput({ plate: "ABC1234" })),
    ).rejects.toThrow(/Já existe um veículo cadastrado com a placa/i);
  });

  it("enforces max 5 vehicles per user", async () => {
    for (let i = 0; i < 5; i += 1) {
      await useVehicleStore.getState().addVehicle(createVehicleInput({ plate: `AAA-000${i}` }));
    }

    await expect(
      useVehicleStore.getState().addVehicle(createVehicleInput({ plate: "BBB-0000" })),
    ).rejects.toThrow(/Limite de 5 veículos/i);
  });

  it("persists after add and updateKm", async () => {
    const key = "checkup-car.vehicles.user-1";
    await useVehicleStore.getState().addVehicle(createVehicleInput({ plate: "ABC-1234" }));
    const [vehicle] = useVehicleStore.getState().vehicles;
    expect(vehicle).toBeTruthy();
    if (!vehicle) throw new Error("Expected a vehicle to exist");

    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith(key, expect.any(String));

    await useVehicleStore.getState().updateKm(vehicle.id, 43000);
    const updated = useVehicleStore.getState().vehicles.find((v) => v.id === vehicle.id);
    expect(updated?.currentKm).toBe(43000);

    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith(key, expect.any(String));
  });

  it("creates an initial km record when adding a vehicle", async () => {
    const created = await useVehicleStore
      .getState()
      .addVehicle(createVehicleInput({ currentKm: 42000 }));

    expect(useVehicleStore.getState().kmRecords).toEqual([
      expect.objectContaining({
        vehicleId: created.id,
        km: 42000,
        recordedAt: expect.any(String),
      }),
    ]);
  });

  it("rejects km updates lower than current km", async () => {
    const created = await useVehicleStore
      .getState()
      .addVehicle(createVehicleInput({ currentKm: 42000 }));

    await expect(useVehicleStore.getState().recordKm(created.id, 41999)).rejects.toThrow(
      /maior ou igual ao último registro/i,
    );
    expect(useVehicleStore.getState().getVehicleById(created.id)?.currentKm).toBe(42000);
  });

  it("records km history ordered by newest date", async () => {
    const created = await useVehicleStore
      .getState()
      .addVehicle(createVehicleInput({ currentKm: 42000 }));

    await useVehicleStore.getState().recordKm(created.id, 43000, "2030-06-02T10:00:00.000Z");

    const history = useVehicleStore.getState().getKmRecordsByVehicleId(created.id);
    expect(history[0]).toMatchObject({
      vehicleId: created.id,
      km: 43000,
      recordedAt: "2030-06-02T10:00:00.000Z",
    });
    expect(history[1]).toMatchObject({ vehicleId: created.id, km: 42000 });
  });

  it("returns vehicles pending km prompt according to configured frequency", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());

    await useVehicleStore.getState().markKmPromptShown(created.id, "2026-06-05T12:00:00.000Z");

    expect(
      useVehicleStore.getState().getVehiclesPendingKmPrompt(new Date("2026-06-06T11:59:00.000Z")),
    ).toEqual([]);
    expect(
      useVehicleStore.getState().getVehiclesPendingKmPrompt(new Date("2026-06-06T12:01:00.000Z")),
    ).toEqual([expect.objectContaining({ id: created.id })]);

    await useVehicleStore.getState().setKmPromptFrequency("weekly");
    expect(
      useVehicleStore.getState().getVehiclesPendingKmPrompt(new Date("2026-06-07T12:01:00.000Z")),
    ).toEqual([]);
  });

  it("returns the created vehicle after addVehicle", async () => {
    const created = await useVehicleStore
      .getState()
      .addVehicle(createVehicleInput({ plate: "ABC-1234" }));

    expect(created).toMatchObject({
      nickname: "Meu carro",
      brand: "Toyota",
      model: "Corolla",
      year: 2022,
      plate: "ABC-1234",
      currentKm: 42000,
    });
    expect(created.id).toEqual(expect.any(String));
  });

  it("gets a vehicle by id", async () => {
    const created = await useVehicleStore
      .getState()
      .addVehicle(createVehicleInput({ plate: "ABC-1234" }));

    expect(useVehicleStore.getState().getVehicleById(created.id)).toEqual(created);
  });

  it("returns undefined when getting a missing vehicle by id", () => {
    expect(useVehicleStore.getState().getVehicleById("missing-id")).toBeUndefined();
  });

  it("gets all vehicles as list items", async () => {
    const first = await useVehicleStore
      .getState()
      .addVehicle(createVehicleInput({ nickname: "Carro A", plate: "ABC-1234" }));
    const second = await useVehicleStore
      .getState()
      .addVehicle(createVehicleInput({ nickname: "Carro B", plate: "DEF-5678" }));

    expect(useVehicleStore.getState().getVehicleList()).toEqual([second, first]);
  });
});
