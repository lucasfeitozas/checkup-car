import {
  countMaintenanceAlerts,
  filterMaintenanceEvents,
  getMaintenanceAlert,
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
    expect(getMaintenanceEventStatus(event({ nextKm: 42000 }), vehicle.currentKm, now)).toBe(
      "overdue",
    );
    expect(
      getMaintenanceEventStatus(
        event({ intervalKm: 10000, nextKm: 42200 }),
        vehicle.currentKm,
        now,
      ),
    ).toBe("alert");
    expect(
      getMaintenanceEventStatus(
        event({ intervalKm: 10000, nextKm: 43000 }),
        vehicle.currentKm,
        now,
      ),
    ).toBe("pending");
  });

  it("calculates visual alert levels by remaining km percentage", () => {
    expect(getMaintenanceAlert(event({ intervalKm: 20000, nextKm: 43100 }), 42000, now).level).toBe(
      "neutral",
    );
    expect(getMaintenanceAlert(event({ intervalKm: 20000, nextKm: 43000 }), 42000, now).level).toBe(
      "green",
    );
    expect(getMaintenanceAlert(event({ intervalKm: 20000, nextKm: 42400 }), 42000, now).level).toBe(
      "orange",
    );
    expect(getMaintenanceAlert(event({ intervalKm: 20000, nextKm: 42199 }), 42000, now).level).toBe(
      "red",
    );
    expect(getMaintenanceAlert(event({ intervalKm: 20000, nextKm: 42000 }), 42000, now).level).toBe(
      "red",
    );
  });

  it("uses the most urgent level between km and date deadlines", () => {
    const dateOnly = event({
      intervalMonths: 12,
      nextDate: "2026-06-15T12:00:00.000Z",
    });
    const kmAndDate = event({
      intervalKm: 20000,
      intervalMonths: 12,
      nextKm: 45000,
      nextDate: "2026-06-15T12:00:00.000Z",
    });

    expect(getMaintenanceAlert(dateOnly, vehicle.currentKm, now).level).toBe("red");
    expect(getMaintenanceAlert(kmAndDate, vehicle.currentKm, now).level).toBe("red");
  });

  it("counts alert levels across the fleet", () => {
    const events = [
      event({ id: "neutral", intervalKm: 10000, nextKm: 43000 }),
      event({ id: "green", intervalKm: 10000, nextKm: 42500 }),
      event({ id: "orange", intervalKm: 10000, nextKm: 42200 }),
      event({ id: "red", intervalKm: 10000, nextKm: 42000 }),
    ];

    expect(countMaintenanceAlerts(events, [vehicle], now)).toEqual({
      neutral: 1,
      green: 1,
      orange: 1,
      red: 1,
    });
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
      event({ id: "overdue", intervalKm: 10000, nextKm: 41000 }),
      event({ id: "alert", intervalKm: 10000, nextKm: 42500 }),
      event({ id: "pending", intervalKm: 10000, nextKm: 45000 }),
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
