import {
  buildVehicleOverview,
  getLastVehicleEventKm,
} from "@/features/dashboard/rules/vehicleOverview";
import type {
  KmRecord,
  MaintenanceEvent,
  MaintenanceExecution,
  Vehicle,
} from "@/features/vehicles/stores/vehicleStore";

const vehicle: Vehicle = {
  id: "vehicle-1",
  nickname: "Corolla",
  brand: "Toyota",
  model: "Corolla",
  year: 2022,
  plate: "ABC-1234",
  currentKm: 42000,
};

function event(override: Partial<MaintenanceEvent>): MaintenanceEvent {
  return {
    id: "event-1",
    vehicleId: vehicle.id,
    typeId: "spark-plugs",
    name: "Velas",
    intervalKm: 10000,
    nextKm: 45000,
    createdAt: "2026-06-01T12:00:00.000Z",
    ...override,
  };
}

describe("vehicleOverview", () => {
  const now = new Date("2026-06-12T12:00:00.000Z");

  it("summarizes active vehicle maintenance health", () => {
    const overview = buildVehicleOverview({
      vehicle,
      now,
      kmRecords: [],
      executionHistory: [],
      maintenanceEvents: [
        event({ id: "overdue", nextKm: 42000 }),
        event({ id: "alert", nextKm: 42200 }),
        event({ id: "pending", nextKm: 45000 }),
        event({ id: "other-vehicle", vehicleId: "vehicle-2", nextKm: 100 }),
      ],
    });

    expect(overview.modelDescription).toBe("Corolla 2022");
    expect(overview.summary).toEqual({
      totalEvents: 3,
      alertEvents: 1,
      overdueEvents: 1,
    });
  });

  it("orders upcoming events by urgency", () => {
    const overview = buildVehicleOverview({
      vehicle,
      now,
      kmRecords: [],
      executionHistory: [],
      maintenanceEvents: [
        event({ id: "pending", name: "Pneus", nextKm: 45000 }),
        event({ id: "orange", name: "Freios", nextKm: 42200 }),
        event({ id: "overdue", name: "Óleo", nextKm: 42000 }),
      ],
    });

    expect(overview.upcomingEvents.map((item) => item.event.id)).toEqual([
      "overdue",
      "orange",
      "pending",
    ]);
  });

  it("uses latest maintenance execution km before falling back to km records", () => {
    const events = [event({ id: "maintenance-1" })];
    const executionHistory: MaintenanceExecution[] = [
      {
        id: "execution-old",
        vehicleEventId: "maintenance-1",
        executionKm: 41000,
        executionDate: "2026-06-01T12:00:00.000Z",
      },
      {
        id: "execution-new",
        vehicleEventId: "maintenance-1",
        executionKm: 41500,
        executionDate: "2026-06-10T12:00:00.000Z",
      },
    ];
    const kmRecords: KmRecord[] = [
      {
        id: "km-new",
        vehicleId: vehicle.id,
        km: 42000,
        recordedAt: "2026-06-12T12:00:00.000Z",
      },
    ];

    expect(getLastVehicleEventKm(vehicle.id, events, executionHistory, kmRecords)).toBe(41500);
    expect(getLastVehicleEventKm(vehicle.id, [], [], kmRecords)).toBe(42000);
  });
});
