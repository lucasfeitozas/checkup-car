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
      maintenanceEvents: [],
      executionHistory: [],
      customMaintenanceTypes: [],
      maintenanceEventSort: "next-km",
      maintenanceEventFilter: "all",
      kmPromptFrequency: "daily",
      lastKmPromptAtByVehicleId: {},
      kmReminderPreferencesByVehicleId: {},
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
    expect(useVehicleStore.getState().maintenanceEvents).toEqual([]);
    expect(useVehicleStore.getState().executionHistory).toEqual([]);
  });

  it("hydrates persisted vehicle state with km records, maintenance events and prompt settings", async () => {
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
      maintenanceEvents: [
        {
          id: "maintenance-1",
          vehicleId: "v-1",
          typeId: "spark-plugs",
          name: "Velas de ignição",
          nextKm: 11200,
          createdAt: "2026-06-01T10:00:00.000Z",
        },
      ],
      executionHistory: [
        {
          id: "execution-1",
          vehicleEventId: "maintenance-1",
          executionKm: 11000,
          executionDate: "2026-06-02T12:00:00.000Z",
          value: 250,
          location: "Oficina Central",
        },
      ],
      customMaintenanceTypes: [
        {
          id: "custom-revisao-especial",
          name: "Revisão especial",
          intervalKm: 10000,
          intervalMonths: 6,
          createdAt: "2026-06-01T10:00:00.000Z",
        },
      ],
      maintenanceEventSort: "next-date",
      maintenanceEventFilter: "alert",
      kmPromptFrequency: "weekly",
      lastKmPromptAtByVehicleId: { "v-1": "2026-06-01T10:00:00.000Z" },
      kmReminderPreferencesByVehicleId: {
        "v-1": {
          enabled: false,
          hour: 9,
          minute: 30,
          notificationId: "notification-1",
        },
      },
    };
    secureStoreMock.getItemAsync.mockImplementation(async (k) =>
      k === key ? JSON.stringify(stored) : null,
    );

    await useVehicleStore.getState().hydrate();

    expect(useVehicleStore.getState()).toMatchObject(stored);
  });

  it("hydrates persisted vehicle state without maintenance events as an empty list", async () => {
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
      kmRecords: [],
      kmPromptFrequency: "weekly",
      lastKmPromptAtByVehicleId: {},
    };
    secureStoreMock.getItemAsync.mockImplementation(async (k) =>
      k === key ? JSON.stringify(stored) : null,
    );

    await useVehicleStore.getState().hydrate();

    expect(useVehicleStore.getState().maintenanceEvents).toEqual([]);
  });

  it("keeps legacy custom maintenance events during hydration", async () => {
    const key = "checkup-car.vehicles.user-1";
    const legacyEvent = {
      id: "maintenance-legacy",
      vehicleId: "v-1",
      typeId: "custom",
      name: "Revisão antiga",
      nextKm: 50000,
      createdAt: "2026-06-01T10:00:00.000Z",
    };
    secureStoreMock.getItemAsync.mockImplementation(async (k) =>
      k === key
        ? JSON.stringify({
            vehicles: [],
            kmRecords: [],
            maintenanceEvents: [legacyEvent],
            kmPromptFrequency: "daily",
            lastKmPromptAtByVehicleId: {},
          })
        : null,
    );

    await useVehicleStore.getState().hydrate();

    expect(useVehicleStore.getState().maintenanceEvents).toEqual([legacyEvent]);
    expect(useVehicleStore.getState().maintenanceEventSort).toBe("next-km");
    expect(useVehicleStore.getState().maintenanceEventFilter).toBe("all");
  });

  it("persists event sorting and filtering preferences with rollback on failure", async () => {
    await useVehicleStore.getState().setMaintenanceEventSort("name");
    await useVehicleStore.getState().setMaintenanceEventFilter("overdue");

    expect(useVehicleStore.getState()).toMatchObject({
      maintenanceEventSort: "name",
      maintenanceEventFilter: "overdue",
    });

    secureStoreMock.setItemAsync.mockRejectedValueOnce(new Error("storage unavailable"));
    await expect(useVehicleStore.getState().setMaintenanceEventSort("next-date")).rejects.toThrow(
      /Não foi possível salvar a ordenação localmente/i,
    );
    expect(useVehicleStore.getState().maintenanceEventSort).toBe("name");
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

  it("adds a predefined maintenance event", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());

    const event = await useVehicleStore.getState().addMaintenanceEvent(created.id, {
      typeId: "spark-plugs",
      nextKm: 52000,
      nextDate: "2027-06-10T12:00:00.000Z",
    });

    expect(event).toMatchObject({
      vehicleId: created.id,
      typeId: "spark-plugs",
      name: "Velas de ignição",
      nextKm: 52000,
      nextDate: "2027-06-10T12:00:00.000Z",
    });
    expect(useVehicleStore.getState().getMaintenanceEventsByVehicleId(created.id)).toEqual([event]);
  });

  it("adds a custom maintenance event", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());

    const event = await useVehicleStore.getState().addMaintenanceEvent(created.id, {
      typeId: "custom",
      customName: "Troca de palhetas traseiras",
      nextKm: 50000,
    });

    expect(event).toMatchObject({
      vehicleId: created.id,
      typeId: "custom",
      name: "Troca de palhetas traseiras",
      nextKm: 50000,
      nextDate: undefined,
    });
  });

  it("creates and persists a reusable custom maintenance type with its first event", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());

    const event = await useVehicleStore.getState().createCustomMaintenanceEvent(created.id, {
      name: "  Revisão   especial ",
      intervalKm: 10000,
      intervalMonths: 6,
      lastExecutionKm: 40000,
      lastExecutionDate: "2025-06-10T12:00:00.000Z",
    });

    const [type] = useVehicleStore.getState().customMaintenanceTypes;
    expect(type).toMatchObject({
      id: expect.stringMatching(/^custom-/),
      name: "Revisão especial",
      intervalKm: 10000,
      intervalMonths: 6,
    });
    expect(event).toMatchObject({
      vehicleId: created.id,
      typeId: type?.id,
      name: "Revisão especial",
      nextKm: 50000,
      nextDate: "2025-12-10T12:00:00.000Z",
    });
  });

  it("reuses a custom maintenance type on another vehicle", async () => {
    const first = await useVehicleStore
      .getState()
      .addVehicle(createVehicleInput({ plate: "ABC-1234" }));
    const second = await useVehicleStore
      .getState()
      .addVehicle(createVehicleInput({ plate: "DEF-5678", currentKm: 80000 }));
    await useVehicleStore.getState().createCustomMaintenanceEvent(first.id, {
      name: "Revisão especial",
      intervalKm: 10000,
      lastExecutionKm: 40000,
    });
    const [type] = useVehicleStore.getState().customMaintenanceTypes;
    if (!type) throw new Error("Expected a custom maintenance type");

    const event = await useVehicleStore.getState().addCustomMaintenanceEvent(second.id, type.id, {
      lastExecutionKm: 75000,
    });

    expect(event).toMatchObject({
      vehicleId: second.id,
      typeId: type.id,
      name: "Revisão especial",
      nextKm: 85000,
    });
  });

  it("rejects duplicate custom maintenance names after normalization", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());
    await useVehicleStore.getState().createCustomMaintenanceEvent(created.id, {
      name: "Revisão especial",
      intervalKm: 10000,
      lastExecutionKm: 40000,
    });

    await expect(
      useVehicleStore.getState().createCustomMaintenanceEvent(created.id, {
        name: "  REVISÃO   ESPECIAL ",
        intervalMonths: 6,
        lastExecutionDate: "2025-06-10T12:00:00.000Z",
      }),
    ).rejects.toThrow("Já existe uma manutenção personalizada com esse nome.");
  });

  it("validates custom maintenance intervals and execution bases", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());

    await expect(
      useVehicleStore.getState().createCustomMaintenanceEvent(created.id, {
        name: "Revisão especial",
      }),
    ).rejects.toThrow("Informe um intervalo em km, em meses ou ambos.");
    await expect(
      useVehicleStore.getState().createCustomMaintenanceEvent(created.id, {
        name: "Revisão especial",
        intervalKm: 10000,
        lastExecutionKm: 43000,
      }),
    ).rejects.toThrow("Última km não pode ser maior que a km atual do veículo.");
    await expect(
      useVehicleStore.getState().createCustomMaintenanceEvent(created.id, {
        name: "Revisão especial",
        intervalMonths: 6,
      }),
    ).rejects.toThrow("Informe a data da última execução.");
  });

  it("rejects maintenance events for missing vehicles", async () => {
    await expect(
      useVehicleStore.getState().addMaintenanceEvent("missing-vehicle", {
        typeId: "brake-check",
        nextKm: 57000,
      }),
    ).rejects.toThrow("Veículo não encontrado.");
  });

  it("rejects maintenance events without next km or due date", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());

    await expect(
      useVehicleStore.getState().addMaintenanceEvent(created.id, {
        typeId: "oil-filter",
      }),
    ).rejects.toThrow("Informe a próxima km ou a data limite da manutenção.");
  });

  it("rolls back maintenance event state when local persistence fails", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());
    secureStoreMock.setItemAsync.mockRejectedValueOnce(new Error("storage unavailable"));

    await expect(
      useVehicleStore.getState().addMaintenanceEvent(created.id, {
        typeId: "brake-check",
        nextKm: 57000,
      }),
    ).rejects.toThrow(/Não foi possível salvar a manutenção localmente/i);

    expect(useVehicleStore.getState().maintenanceEvents).toEqual([]);
  });

  it("rolls back custom type and event atomically when local persistence fails", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());
    secureStoreMock.setItemAsync.mockRejectedValueOnce(new Error("storage unavailable"));

    await expect(
      useVehicleStore.getState().createCustomMaintenanceEvent(created.id, {
        name: "Revisão especial",
        intervalKm: 10000,
        lastExecutionKm: 40000,
      }),
    ).rejects.toThrow(/Não foi possível salvar a manutenção localmente/i);

    expect(useVehicleStore.getState().customMaintenanceTypes).toEqual([]);
    expect(useVehicleStore.getState().maintenanceEvents).toEqual([]);
  });

  it("registers an execution, recalculates the event and saves it in history", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());
    const event = await useVehicleStore.getState().addMaintenanceEvent(created.id, {
      typeId: "brake-fluid",
      nextKm: 52000,
      nextDate: "2027-01-01T12:00:00.000Z",
    });

    const execution = await useVehicleStore.getState().executeMaintenanceEvent(event.id, {
      executionKm: 41000,
      executionDate: "2026-06-10T12:00:00.000Z",
      value: 350.5,
      location: "  Oficina Central  ",
    });

    expect(execution).toMatchObject({
      vehicleEventId: event.id,
      executionKm: 41000,
      executionDate: "2026-06-10T12:00:00.000Z",
      value: 350.5,
      location: "Oficina Central",
    });
    expect(useVehicleStore.getState().getMaintenanceEventsByVehicleId(created.id)[0]).toMatchObject(
      {
        id: event.id,
        nextKm: 51000,
        nextDate: "2027-06-10T12:00:00.000Z",
      },
    );
    expect(useVehicleStore.getState().getExecutionHistoryByVehicleId(created.id)).toEqual([
      execution,
    ]);
  });

  it("rejects invalid maintenance executions", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());
    const event = await useVehicleStore.getState().addMaintenanceEvent(created.id, {
      typeId: "brake-check",
      nextKm: 57000,
    });

    await expect(
      useVehicleStore.getState().executeMaintenanceEvent(event.id, {
        executionKm: 42001,
        executionDate: "2026-06-10T12:00:00.000Z",
      }),
    ).rejects.toThrow("Km de execução não pode ser maior que a km atual.");
  });

  it("rolls back event and history when execution persistence fails", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());
    const event = await useVehicleStore.getState().addMaintenanceEvent(created.id, {
      typeId: "spark-plugs",
      nextKm: 52000,
    });
    secureStoreMock.setItemAsync.mockRejectedValueOnce(new Error("storage unavailable"));

    await expect(
      useVehicleStore.getState().executeMaintenanceEvent(event.id, {
        executionKm: 41000,
        executionDate: "2026-06-10T12:00:00.000Z",
      }),
    ).rejects.toThrow(/Não foi possível salvar a execução localmente/i);

    expect(useVehicleStore.getState().executionHistory).toEqual([]);
    expect(useVehicleStore.getState().maintenanceEvents).toEqual([event]);
  });

  it("edits type, interval and last execution while recalculating the schedule", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());
    const event = await useVehicleStore.getState().addMaintenanceEvent(created.id, {
      typeId: "brake-check",
      nextKm: 57000,
    });

    const updated = await useVehicleStore.getState().updateMaintenanceEvent(event.id, {
      typeId: "brake-fluid",
      intervalKm: 15000,
      intervalMonths: 6,
      lastExecutionKm: 40000,
      lastExecutionDate: "2026-06-10T12:00:00.000Z",
    });

    expect(updated).toMatchObject({
      id: event.id,
      typeId: "brake-fluid",
      name: "Fluido de freio",
      intervalKm: 15000,
      intervalMonths: 6,
      lastExecutionKm: 40000,
      lastExecutionDate: "2026-06-10T12:00:00.000Z",
      nextKm: 55000,
      nextDate: "2026-12-10T12:00:00.000Z",
    });
  });

  it("rolls back maintenance edits when local persistence fails", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());
    const event = await useVehicleStore.getState().addMaintenanceEvent(created.id, {
      typeId: "brake-check",
      nextKm: 57000,
    });
    secureStoreMock.setItemAsync.mockRejectedValueOnce(new Error("storage unavailable"));

    await expect(
      useVehicleStore.getState().updateMaintenanceEvent(event.id, {
        typeId: "spark-plugs",
        intervalKm: 10000,
        lastExecutionKm: 40000,
      }),
    ).rejects.toThrow(/Não foi possível editar a manutenção localmente/i);

    expect(useVehicleStore.getState().maintenanceEvents).toEqual([event]);
  });

  it("deletes a maintenance event and its execution history", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());
    const event = await useVehicleStore.getState().addMaintenanceEvent(created.id, {
      typeId: "spark-plugs",
      nextKm: 52000,
    });
    await useVehicleStore.getState().executeMaintenanceEvent(event.id, {
      executionKm: 41000,
      executionDate: "2026-06-10T12:00:00.000Z",
    });

    await useVehicleStore.getState().deleteMaintenanceEvent(event.id);

    expect(useVehicleStore.getState().maintenanceEvents).toEqual([]);
    expect(useVehicleStore.getState().executionHistory).toEqual([]);
  });

  it("rolls back event deletion when local persistence fails", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());
    const event = await useVehicleStore.getState().addMaintenanceEvent(created.id, {
      typeId: "spark-plugs",
      nextKm: 52000,
    });
    const execution = await useVehicleStore.getState().executeMaintenanceEvent(event.id, {
      executionKm: 41000,
      executionDate: "2026-06-10T12:00:00.000Z",
    });
    secureStoreMock.setItemAsync.mockRejectedValueOnce(new Error("storage unavailable"));

    await expect(useVehicleStore.getState().deleteMaintenanceEvent(event.id)).rejects.toThrow(
      /Não foi possível excluir a manutenção localmente/i,
    );

    expect(useVehicleStore.getState().maintenanceEvents).toHaveLength(1);
    expect(useVehicleStore.getState().executionHistory).toEqual([execution]);
  });

  it("returns vehicles pending km prompt when km was not recorded today", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());

    expect(
      useVehicleStore.getState().getVehiclesPendingKmPrompt(new Date("2026-06-06T11:59:00.000Z")),
    ).toEqual([expect.objectContaining({ id: created.id })]);

    await useVehicleStore.getState().recordKm(created.id, 43000, "2026-06-06T12:00:00.000Z");

    expect(
      useVehicleStore.getState().getVehiclesPendingKmPrompt(new Date("2026-06-06T12:01:00.000Z")),
    ).toEqual([]);
  });

  it("persists per-vehicle km reminder preferences and skip until tomorrow", async () => {
    const created = await useVehicleStore.getState().addVehicle(createVehicleInput());

    await useVehicleStore.getState().setKmReminderPreference(created.id, {
      enabled: false,
      hour: 19,
      minute: 45,
      notificationId: "notification-1",
    });

    expect(useVehicleStore.getState().kmReminderPreferencesByVehicleId[created.id]).toMatchObject({
      enabled: false,
      hour: 19,
      minute: 45,
      notificationId: "notification-1",
    });
    expect(
      useVehicleStore.getState().getVehiclesPendingKmPrompt(new Date("2026-06-06T12:00:00.000Z")),
    ).toEqual([]);

    await useVehicleStore.getState().setKmReminderPreference(created.id, { enabled: true });
    await useVehicleStore
      .getState()
      .skipKmPromptUntilTomorrow(created.id, new Date("2026-06-06T12:00:00.000Z"));

    expect(
      useVehicleStore.getState().getVehiclesPendingKmPrompt(new Date("2026-06-06T13:00:00.000Z")),
    ).toEqual([]);
    expect(
      useVehicleStore.getState().getVehiclesPendingKmPrompt(new Date("2026-06-07T04:01:00.000Z")),
    ).toEqual([expect.objectContaining({ id: created.id })]);
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
