import {
  formatPlate,
  isValidBrazilianPlate,
  validateNewVehicleInput,
} from "@/lib/vehicleValidation";
import type { NewVehicleInput, Vehicle } from "@/store/vehicleStore";

function createVehicleInput(override?: Partial<NewVehicleInput>): NewVehicleInput {
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

function createVehicle(index: number, override?: Partial<Vehicle>): Vehicle {
  return {
    id: `vehicle-${index}`,
    nickname: `Carro ${index}`,
    brand: "Toyota",
    model: "Corolla",
    year: 2022,
    plate: `ABC-123${index}`,
    currentKm: 42000,
    ...(override ?? {}),
  };
}

describe("vehicleValidation", () => {
  it("accepts old and Mercosul Brazilian plate formats", () => {
    expect(isValidBrazilianPlate("AAA-0000")).toBe(true);
    expect(isValidBrazilianPlate("AAA0000")).toBe(true);
    expect(isValidBrazilianPlate("AAA0A00")).toBe(true);
  });

  it("formats old plate format and preserves Mercosul format", () => {
    expect(formatPlate("aaa0000")).toBe("AAA-0000");
    expect(formatPlate("aaa0a00")).toBe("AAA0A00");
  });

  it("rejects invalid plates", () => {
    const errors = validateNewVehicleInput(createVehicleInput({ plate: "ABC-12" }), []);

    expect(errors).toContainEqual({
      field: "plate",
      message: "Placa inválida. Use AAA-0000 ou AAA0A00.",
    });
  });

  it("requires mandatory fields", () => {
    const errors = validateNewVehicleInput(
      {
        plate: "",
        nickname: "",
        model: "",
        year: undefined,
        currentKm: undefined,
      },
      [],
    );

    expect(errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(["plate", "nickname", "model", "year", "currentKm"]),
    );
  });

  it("rejects invalid year", () => {
    const errors = validateNewVehicleInput(createVehicleInput({ year: 1899 }), []);

    expect(errors).toContainEqual({
      field: "year",
      message: "Ano deve estar entre 1900 e o ano atual.",
    });
  });

  it("rejects invalid current mileage", () => {
    const errors = validateNewVehicleInput(createVehicleInput({ currentKm: -1 }), []);

    expect(errors).toContainEqual({
      field: "currentKm",
      message: "Km atual deve ser um número maior ou igual a zero.",
    });
  });

  it("rejects duplicate normalized plates", () => {
    const errors = validateNewVehicleInput(createVehicleInput({ plate: "ABC1234" }), [
      createVehicle(1, { plate: "abc-1234" }),
    ]);

    expect(errors).toContainEqual({ field: "plate", message: "Placa já cadastrada." });
  });

  it("rejects inputs when account has reached the vehicle limit", () => {
    const vehicles = Array.from({ length: 5 }, (_, index) =>
      createVehicle(index, { plate: `AAA-000${index}` }),
    );

    const errors = validateNewVehicleInput(createVehicleInput({ plate: "BBB-0000" }), vehicles);

    expect(errors).toContainEqual({
      field: "limit",
      message: "Você atingiu o limite máximo de 5 veículos.",
    });
  });
});
