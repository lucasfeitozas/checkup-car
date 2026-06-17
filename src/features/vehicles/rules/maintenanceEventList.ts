import type {
  MaintenanceEvent,
  MaintenanceExecution,
  Vehicle,
} from "@/features/vehicles/stores/vehicleStore";

export type MaintenanceEventSort = "next-km" | "next-date" | "name";
export type MaintenanceEventFilter = "all" | "pending" | "alert" | "overdue" | "completed";
export type MaintenanceEventStatus = Exclude<MaintenanceEventFilter, "all" | "completed">;
export type MaintenanceAlertLevel = "neutral" | "green" | "orange" | "red";

export type MaintenanceAlertSummary = Record<MaintenanceAlertLevel, number>;

export type MaintenanceAlert = {
  level: MaintenanceAlertLevel;
  remainingKm?: number;
  remainingKmPercent?: number;
  remainingDays?: number;
  remainingDatePercent?: number;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  const originalDay = next.getDate();

  next.setMonth(next.getMonth() + months);

  if (next.getDate() < originalDay) {
    next.setDate(0);
  }

  return next;
}

function subtractMonths(date: Date, months: number): Date {
  return addMonths(date, -months);
}

function getLevelFromRemainingPercent(remainingPercent: number): MaintenanceAlertLevel {
  if (remainingPercent <= 1) {
    return "red";
  }

  if (remainingPercent <= 2) {
    return "orange";
  }

  if (remainingPercent <= 5) {
    return "green";
  }

  return "neutral";
}

function compareAlertLevel(
  current: MaintenanceAlertLevel,
  candidate: MaintenanceAlertLevel,
): MaintenanceAlertLevel {
  const priority: Record<MaintenanceAlertLevel, number> = {
    neutral: 0,
    green: 1,
    orange: 2,
    red: 3,
  };

  return priority[candidate] > priority[current] ? candidate : current;
}

function getRemainingDays(nextDate: string | undefined, now: Date): number | undefined {
  if (!nextDate) {
    return undefined;
  }

  const nextDateTime = Date.parse(nextDate);
  if (Number.isNaN(nextDateTime)) {
    return undefined;
  }

  return Math.ceil((startOfUtcDay(new Date(nextDateTime)) - startOfUtcDay(now)) / DAY_IN_MS);
}

export function getMaintenanceEventStatus(
  event: MaintenanceEvent,
  currentKm: number,
  now: Date = new Date(),
): MaintenanceEventStatus {
  const alert = getMaintenanceAlert(event, currentKm, now);

  if (alert.level === "red" && (alert.remainingKm ?? 1) <= 0) {
    return "overdue";
  }

  if (alert.level === "red" && (alert.remainingDays ?? 1) <= 0) {
    return "overdue";
  }

  if (alert.level === "green" || alert.level === "orange" || alert.level === "red") {
    return "alert";
  }

  return "pending";
}

export function getMaintenanceAlert(
  event: MaintenanceEvent,
  currentKm: number,
  now: Date = new Date(),
): MaintenanceAlert {
  const remainingKm = event.nextKm === undefined ? undefined : event.nextKm - currentKm;
  const remainingDays = getRemainingDays(event.nextDate, now);
  let level: MaintenanceAlertLevel = "neutral";
  let remainingKmPercent: number | undefined;
  let remainingDatePercent: number | undefined;

  if (remainingKm !== undefined && remainingKm <= 0) {
    level = "red";
  } else if (remainingKm !== undefined && event.intervalKm !== undefined && event.intervalKm > 0) {
    remainingKmPercent = (remainingKm / event.intervalKm) * 100;
    level = compareAlertLevel(level, getLevelFromRemainingPercent(remainingKmPercent));
  }

  if (remainingDays !== undefined && remainingDays <= 0) {
    level = "red";
  } else if (
    remainingDays !== undefined &&
    event.nextDate &&
    event.intervalMonths !== undefined &&
    event.intervalMonths > 0
  ) {
    const nextDateTime = Date.parse(event.nextDate);
    const nextDate = new Date(nextDateTime);
    const baseDate = event.lastExecutionDate
      ? new Date(event.lastExecutionDate)
      : subtractMonths(nextDate, event.intervalMonths);
    const intervalDays = Math.ceil((startOfUtcDay(nextDate) - startOfUtcDay(baseDate)) / DAY_IN_MS);

    if (intervalDays > 0) {
      remainingDatePercent = (remainingDays / intervalDays) * 100;
      level = compareAlertLevel(level, getLevelFromRemainingPercent(remainingDatePercent));
    }
  }

  return {
    level,
    remainingKm,
    remainingKmPercent,
    remainingDays,
    remainingDatePercent,
  };
}

export function countMaintenanceAlerts(
  events: MaintenanceEvent[],
  vehicles: Vehicle[],
  now: Date = new Date(),
): MaintenanceAlertSummary {
  const currentKmByVehicleId = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.currentKm]));
  return events.reduce<MaintenanceAlertSummary>(
    (summary, event) => {
      const alert = getMaintenanceAlert(event, currentKmByVehicleId.get(event.vehicleId) ?? 0, now);
      summary[alert.level] += 1;
      return summary;
    },
    { neutral: 0, green: 0, orange: 0, red: 0 },
  );
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
