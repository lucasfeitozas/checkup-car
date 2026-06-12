import {
  filterMaintenanceEvents,
  getMaintenanceEventStatus,
  sortMaintenanceEvents,
} from "@/features/vehicles/rules/maintenanceEventList";
import type {
  MaintenanceEvent,
  MaintenanceExecution,
  Vehicle,
} from "@/features/vehicles/stores/vehicleStore";

const vehicle: Vehicle = {
  id: "vehicle-1",
  nickname: "Carro",
  model: "Corolla",
  year: 2022,
  plate: "ABC1D23",
  currentKm: 42000,
};

function event(override: Partial<MaintenanceEvent>): MaintenanceEvent {
  return {
    id: "event-1",
    vehicleId: vehicle.id,
    typeId: "spark-plugs",
    name: "Velas",
    createdAt: "2026-06-01T12:00:00.000Z",
    ...override,
  };
}

describe("maintenanceEventList", () => {
  const now = new Date("2026-06-12T12:00:00.000Z");

  it("classifies overdue, alert and pending events by the most urgent deadline", () => {
    expect(getMaintenanceEventStatus(event({ nextKm: 41999 }), vehicle.currentKm, now)).toBe(
      "overdue",
    );
    expect(getMaintenanceEventStatus(event({ nextKm: 43000 }), vehicle.currentKm, now)).toBe(
      "alert",
    );
    expect(
      getMaintenanceEventStatus(
        event({ nextDate: "2026-07-12T12:00:00.000Z" }),
        vehicle.currentKm,
        now,
      ),
    ).toBe("alert");
    expect(getMaintenanceEventStatus(event({ nextKm: 45000 }), vehicle.currentKm, now)).toBe(
      "pending",
    );
  });

  it("sorts by km proximity, date and name with missing deadlines last", () => {
    const events = [
      event({ id: "no-km", name: "Zeta" }),
      event({ id: "far", name: "Beta", nextKm: 45000, nextDate: "2026-08-01T12:00:00.000Z" }),
      event({ id: "near", name: "Alfa", nextKm: 42500, nextDate: "2026-07-01T12:00:00.000Z" }),
    ];

    expect(sortMaintenanceEvents(events, [vehicle], "next-km").map((item) => item.id)).toEqual([
      "near",
      "far",
      "no-km",
    ]);
    expect(sortMaintenanceEvents(events, [vehicle], "next-date").map((item) => item.id)).toEqual([
      "near",
      "far",
      "no-km",
    ]);
    expect(sortMaintenanceEvents(events, [vehicle], "name").map((item) => item.id)).toEqual([
      "near",
      "far",
      "no-km",
    ]);
  });

  it("filters active statuses and events with execution history", () => {
    const events = [
      event({ id: "overdue", nextKm: 41000 }),
      event({ id: "alert", nextKm: 42500 }),
      event({ id: "pending", nextKm: 45000 }),
    ];
    const history: MaintenanceExecution[] = [
      {
        id: "execution-1",
        vehicleEventId: "pending",
        executionKm: 40000,
        executionDate: "2026-06-01T12:00:00.000Z",
      },
    ];

    expect(filterMaintenanceEvents(events, [vehicle], history, "overdue", now)).toEqual([
      events[0],
    ]);
    expect(filterMaintenanceEvents(events, [vehicle], history, "alert", now)).toEqual([events[1]]);
    expect(filterMaintenanceEvents(events, [vehicle], history, "pending", now)).toEqual([
      events[2],
    ]);
    expect(filterMaintenanceEvents(events, [vehicle], history, "completed", now)).toEqual([
      events[2],
    ]);
  });
});
