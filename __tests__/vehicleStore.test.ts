import type { Vehicle } from "@/store/vehicleStore";

function setupStore() {
  jest.resetModules();

  const mockRunAsync = jest.fn();
  const mockGetAllAsync = jest.fn();
  const mockGetSqliteDb = jest.fn().mockResolvedValue({
    runAsync: mockRunAsync,
    getAllAsync: mockGetAllAsync,
  });

  jest.doMock("@/db/client", () => ({
    getSqliteDb: mockGetSqliteDb,
  }));

  const storeModule = require("@/store/vehicleStore") as any;
  return {
    useVehicleStore: storeModule.useVehicleStore,
    mockRunAsync,
    mockGetAllAsync,
    mockGetSqliteDb,
  };
}

describe("vehicleStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hidrata veículos a partir do sqlite", async () => {
    const { useVehicleStore, mockGetAllAsync } = setupStore();

    useVehicleStore.setState({ vehicles: [], isHydrated: false });

    mockGetAllAsync.mockResolvedValueOnce([
      {
        id: "v1",
        plate: "ABC-1234",
        nickname: "Meu carro",
        year: 2022,
        currentKm: 42000,
        brand: null,
        model: "Corolla",
      },
    ]);

    await useVehicleStore.getState().hydrate();

    expect(mockGetAllAsync).toHaveBeenCalledTimes(1);
    expect(useVehicleStore.getState().isHydrated).toBe(true);
    expect(useVehicleStore.getState().vehicles).toEqual<Vehicle[]>([
      {
        id: "v1",
        plate: "ABC-1234",
        nickname: "Meu carro",
        year: 2022,
        currentKm: 42000,
        brand: undefined,
        model: "Corolla",
      },
    ]);
  });

  it("salva veículo no sqlite ao adicionar", async () => {
    const { useVehicleStore, mockRunAsync } = setupStore();

    useVehicleStore.setState({ vehicles: [], isHydrated: false });
    mockRunAsync.mockResolvedValue({} as any);

    const vehicle: Vehicle = {
      id: "v2",
      plate: "ABC-1234",
      nickname: "Carro 2",
      model: "Civic",
      year: 2021,
      currentKm: 1000,
    };

    await useVehicleStore.getState().addVehicle(vehicle);

    expect(mockRunAsync).toHaveBeenCalledTimes(2);
    expect(mockRunAsync).toHaveBeenNthCalledWith(
      1,
      "INSERT OR IGNORE INTO modelos_carro (id, marca, modelo, ano_inicio, ano_fim) VALUES (?, ?, ?, ?, ?)",
      "manual-civic-2021",
      "",
      "Civic",
      2021,
      2021,
    );
    expect(mockRunAsync).toHaveBeenNthCalledWith(
      2,
      "INSERT INTO carros (id, usuario_id, modelo_id, placa, nome_apelido, ano, km_atual) VALUES (?, ?, ?, ?, ?, ?, ?)",
      "v2",
      "local-user",
      "manual-civic-2021",
      "ABC-1234",
      "Carro 2",
      2021,
      1000,
    );
    expect(useVehicleStore.getState().vehicles[0]).toEqual(vehicle);
  });

  it("retorna erro claro se placa duplicada (antes de gravar)", async () => {
    const { useVehicleStore, mockRunAsync } = setupStore();

    useVehicleStore.setState({
      isHydrated: true,
      vehicles: [
        {
          id: "v1",
          plate: "ABC-1234",
          nickname: "Carro",
          model: "Civic",
          year: 2021,
          currentKm: 1,
        },
      ],
    });

    await expect(
      useVehicleStore.getState().addVehicle({
        id: "v2",
        plate: "ABC1234",
        nickname: "Carro 2",
        model: "Civic",
        year: 2021,
        currentKm: 2,
      }),
    ).rejects.toThrow("Já existe um veículo cadastrado com a placa ABC1234.");

    expect(mockRunAsync).not.toHaveBeenCalled();
  });

  it("atualiza km no sqlite ao atualizarKm", async () => {
    const { useVehicleStore, mockRunAsync } = setupStore();

    mockRunAsync.mockResolvedValue({} as any);
    useVehicleStore.setState({
      isHydrated: true,
      vehicles: [
        {
          id: "v1",
          plate: "ABC-1234",
          nickname: "Carro",
          model: "Civic",
          year: 2021,
          currentKm: 1,
        },
      ],
    });

    await useVehicleStore.getState().updateKm("v1", 10);

    expect(mockRunAsync).toHaveBeenCalledWith(
      "UPDATE carros SET km_atual = ? WHERE id = ? AND usuario_id = ?",
      [10, "v1", "local-user"],
    );
    expect(useVehicleStore.getState().vehicles[0]?.currentKm).toBe(10);
  });
});
