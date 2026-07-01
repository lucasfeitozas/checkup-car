import { buildVehicleMaintenanceTimeline } from "@/features/vehicles/rules/vehicleMaintenanceTimeline";
import type {
  MaintenanceEvent,
  MaintenanceExecution,
} from "@/features/vehicles/stores/vehicleStore";

function event(override: Partial<MaintenanceEvent>): MaintenanceEvent {
  return {
    id: "maintenance-1",
    vehicleId: "vehicle-1",
    typeId: "spark-plugs",
    name: "Velas de ignição",
    createdAt: "2026-01-01T12:00:00.000Z",
    ...override,
  };
}

function execution(override: Partial<MaintenanceExecution>): MaintenanceExecution {
  return {
    id: "execution-1",
    vehicleEventId: "maintenance-1",
    executionKm: 40000,
    executionDate: "2026-01-10T12:00:00.000Z",
    ...override,
  };
}

describe("vehicleMaintenanceTimeline", () => {
  it("groups vehicle executions by month and calculates totals", () => {
    const events = [
      event({ id: "maintenance-1", typeId: "spark-plugs", name: "Velas" }),
      event({ id: "maintenance-2", typeId: "brake-fluid", name: "Fluido" }),
      event({ id: "maintenance-other", vehicleId: "vehicle-2" }),
    ];
    const executions = [
      execution({
        id: "execution-1",
        vehicleEventId: "maintenance-1",
        executionDate: "2026-01-10T12:00:00.000Z",
        value: 200,
      }),
      execution({
        id: "execution-2",
        vehicleEventId: "maintenance-2",
        executionDate: "2026-02-05T12:00:00.000Z",
        value: 350,
      }),
      execution({
        id: "execution-3",
        vehicleEventId: "maintenance-1",
        executionDate: "2026-02-20T12:00:00.000Z",
        value: 150,
      }),
      execution({
        id: "execution-other",
        vehicleEventId: "maintenance-other",
        executionDate: "2026-02-20T12:00:00.000Z",
        value: 999,
      }),
    ];

    const timeline = buildVehicleMaintenanceTimeline("vehicle-1", events, executions);

    expect(timeline.totalPaid).toBe(700);
    expect(timeline.groups.map((group) => group.id)).toEqual(["2026-02", "2026-01"]);
    expect(timeline.groups[0]).toMatchObject({
      label: "fevereiro de 2026",
      totalPaid: 500,
    });
    expect(timeline.groups[0]?.items.map((item) => item.execution.id)).toEqual([
      "execution-3",
      "execution-2",
    ]);
  });

  it("filters by event type and inclusive period", () => {
    const events = [
      event({ id: "maintenance-1", typeId: "spark-plugs" }),
      event({ id: "maintenance-2", typeId: "brake-fluid" }),
    ];
    const executions = [
      execution({
        id: "outside-start",
        vehicleEventId: "maintenance-1",
        executionDate: "2026-01-31T12:00:00.000Z",
        value: 100,
      }),
      execution({
        id: "inside",
        vehicleEventId: "maintenance-1",
        executionDate: "2026-02-01T00:00:00.000Z",
        value: 200,
      }),
      execution({
        id: "other-type",
        vehicleEventId: "maintenance-2",
        executionDate: "2026-02-10T12:00:00.000Z",
        value: 300,
      }),
      execution({
        id: "outside-end",
        vehicleEventId: "maintenance-1",
        executionDate: "2026-03-01T00:00:00.000Z",
        value: 400,
      }),
    ];

    const timeline = buildVehicleMaintenanceTimeline("vehicle-1", events, executions, {
      eventTypeId: "spark-plugs",
      startDate: "2026-02-01T12:00:00.000Z",
      endDate: "2026-02-28T12:00:00.000Z",
    });

    expect(timeline.totalPaid).toBe(200);
    expect(timeline.groups).toHaveLength(1);
    expect(timeline.groups[0]?.items.map((item) => item.execution.id)).toEqual(["inside"]);
  });
});
