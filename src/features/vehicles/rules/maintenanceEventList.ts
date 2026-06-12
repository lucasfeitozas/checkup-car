import type {
  MaintenanceEvent,
  MaintenanceExecution,
  Vehicle,
} from "@/features/vehicles/stores/vehicleStore";

export type MaintenanceEventSort = "next-km" | "next-date" | "name";
export type MaintenanceEventFilter = "all" | "pending" | "alert" | "overdue" | "completed";
export type MaintenanceEventStatus = Exclude<MaintenanceEventFilter, "all" | "completed">;

const ALERT_KM_THRESHOLD = 1000;
const ALERT_DATE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function getMaintenanceEventStatus(
  event: MaintenanceEvent,
  currentKm: number,
  now: Date = new Date(),
): MaintenanceEventStatus {
  const remainingKm = event.nextKm === undefined ? undefined : event.nextKm - currentKm;
  const nextDateTime = event.nextDate ? Date.parse(event.nextDate) : undefined;
  const remainingTime =
    nextDateTime === undefined || Number.isNaN(nextDateTime)
      ? undefined
      : startOfUtcDay(new Date(nextDateTime)) - startOfUtcDay(now);

  if (
    (remainingKm !== undefined && remainingKm < 0) ||
    (remainingTime !== undefined && remainingTime < 0)
  ) {
    return "overdue";
  }

  if (
    (remainingKm !== undefined && remainingKm <= ALERT_KM_THRESHOLD) ||
    (remainingTime !== undefined && remainingTime <= ALERT_DATE_THRESHOLD_MS)
  ) {
    return "alert";
  }

  return "pending";
}

export function filterMaintenanceEvents(
  events: MaintenanceEvent[],
  vehicles: Vehicle[],
  executionHistory: MaintenanceExecution[],
  filter: MaintenanceEventFilter,
  now: Date = new Date(),
): MaintenanceEvent[] {
  if (filter === "all") {
    return events;
  }

  if (filter === "completed") {
    const completedEventIds = new Set(
      executionHistory.map((execution) => execution.vehicleEventId),
    );
    return events.filter((event) => completedEventIds.has(event.id));
  }

  const currentKmByVehicleId = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.currentKm]));
  return events.filter(
    (event) =>
      getMaintenanceEventStatus(event, currentKmByVehicleId.get(event.vehicleId) ?? 0, now) ===
      filter,
  );
}

function compareOptionalNumbers(a: number | undefined, b: number | undefined): number {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return a - b;
}

export function sortMaintenanceEvents(
  events: MaintenanceEvent[],
  vehicles: Vehicle[],
  sort: MaintenanceEventSort,
): MaintenanceEvent[] {
  const currentKmByVehicleId = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.currentKm]));

  return [...events].sort((a, b) => {
    if (sort === "name") {
      return a.name.localeCompare(b.name, "pt-BR");
    }

    if (sort === "next-date") {
      const aTime = a.nextDate ? Date.parse(a.nextDate) : undefined;
      const bTime = b.nextDate ? Date.parse(b.nextDate) : undefined;
      return compareOptionalNumbers(
        aTime !== undefined && !Number.isNaN(aTime) ? aTime : undefined,
        bTime !== undefined && !Number.isNaN(bTime) ? bTime : undefined,
      );
    }

    const aRemaining =
      a.nextKm === undefined ? undefined : a.nextKm - (currentKmByVehicleId.get(a.vehicleId) ?? 0);
    const bRemaining =
      b.nextKm === undefined ? undefined : b.nextKm - (currentKmByVehicleId.get(b.vehicleId) ?? 0);
    return compareOptionalNumbers(aRemaining, bRemaining);
  });
}
